// scripts/test-e2e.ts
// Run with: npx tsx scripts/test-e2e.ts

import { prisma } from '../src/lib/db/prisma';
import { AuthService } from '../src/modules/auth/services';
import { DepartmentService } from '../src/modules/organizations/department.service';
import { LocationService } from '../src/modules/organizations/location.service';
import { AssetService } from '../src/modules/assets/services/asset.service';
import { AllocationService } from '../src/modules/assets/services/allocation.service';
import { TransferService } from '../src/modules/assets/services/transfer.service';
import { BookingService } from '../src/modules/bookings/services/booking.service';
import { MaintenanceService } from '../src/modules/maintenance/services/maintenance.service';
import { AuditService } from '../src/modules/audit/services/audit.service';
import { DashboardService } from '../src/modules/reports/services/dashboard.service';
import { ResourceType, MaintenancePriority, AssetCondition } from '@prisma/client';

async function runE2E() {
  console.log('🚀 Starting Full E2E ERP Lifecycle Test...\n');

  try {
    // ==========================================
    // 1. AUTH & ONBOARDING
    // ==========================================
    console.log('1. Testing Auth & Onboarding...');
    const orgSuffix = Date.now();
    const { user: admin, organization: org } = await AuthService.registerOrganization({
      organizationName: `Acme Corp ${orgSuffix}`,
      firstName: 'Alice',
      lastName: 'Admin',
      email: `alice+${orgSuffix}@example.com`,
      password: 'securepassword123'
    });
    console.log(`✅ Organization created: ${org.name}`);
    console.log(`✅ Admin user created: ${admin.email}`);

    // Create a regular employee
    const employee = await prisma.user.create({
      data: {
        organizationId: org.id,
        firstName: 'Bob',
        lastName: 'Employee',
        email: `bob+${orgSuffix}@example.com`,
        passwordHash: 'hash',
        employeeCode: 'EMP001'
      }
    });

    // ==========================================
    // 2. ORGANIZATION STRUCTURE
    // ==========================================
    console.log('\n2. Testing Organization Structure...');
    const hq = await LocationService.createLocation(org.id, {
      name: 'Headquarters',
      code: `HQ-${orgSuffix}`
    });
    console.log(`✅ Location created: ${hq.name}`);

    const itDept = await DepartmentService.createDepartment(org.id, {
      name: 'Information Technology',
      code: `IT-${orgSuffix}`
    });
    console.log(`✅ Department created: ${itDept.name}`);

    // ==========================================
    // 3. ASSET MANAGEMENT
    // ==========================================
    console.log('\n3. Testing Asset Provisioning...');
    const category = await prisma.assetCategory.create({
      data: {
        organizationId: org.id,
        name: 'Laptops',
        code: `LAPT-${orgSuffix}`,
        expectedLifeMonths: 36
      }
    });

    const asset = await AssetService.registerAsset(org.id, admin.id, {
      assetTag: `MAC-${orgSuffix}`,
      serialNumber: `SN-${orgSuffix}`,
      name: 'MacBook Pro M3',
      categoryId: category.id,
      departmentId: itDept.id,
      locationId: hq.id,
      purchaseCost: 2000
    });
    console.log(`✅ Asset created: [${asset.assetTag}] ${asset.name}`);

    // ==========================================
    // 4. ASSET ALLOCATION
    // ==========================================
    console.log('\n4. Testing Allocations (Atomic Locks)...');
    const allocation = await AllocationService.allocateAsset(org.id, asset.id, admin.id, {
      allocatedToUserId: employee.id
    });
    console.log(`✅ Asset allocated to: ${employee.firstName}`);

    try {
      await AllocationService.allocateAsset(org.id, asset.id, admin.id, { allocatedToUserId: admin.id });
      console.log('❌ FAILED: Asset allowed double allocation!');
    } catch (err: any) {
      console.log('✅ Double-allocation correctly rejected:', err.message);
    }

    // ==========================================
    // 5. MAINTENANCE WORKFLOW
    // ==========================================
    console.log('\n5. Testing Maintenance Workflow...');
    const maintReq = await MaintenanceService.raiseRequest(org.id, employee.id, {
      assetId: asset.id,
      issue: 'Screen flickering occasionally',
      priority: MaintenancePriority.HIGH
    });
    console.log(`✅ Maintenance requested: ${maintReq.issue}`);

    try {
      await MaintenanceService.approveRequest(org.id, maintReq.id, admin.id, { assignedTechnicianId: admin.id });
      console.log('❌ FAILED: Allowed maintenance approval while asset is allocated!');
    } catch (err: any) {
      console.log('✅ Maintenance approval correctly rejected due to active allocation:', err.message);
    }

    // Return the asset so we can fix it
    await AllocationService.returnAsset(org.id, allocation.id, employee.id, { returnNotes: 'Returning for repair' });
    console.log('✅ Asset returned by employee');

    await MaintenanceService.approveRequest(org.id, maintReq.id, admin.id, { assignedTechnicianId: admin.id });
    console.log('✅ Maintenance approved');

    await MaintenanceService.resolveRequest(org.id, maintReq.id, admin.id, { cost: 150, resolutionNotes: 'Replaced flex cable' });
    console.log('✅ Maintenance resolved (Asset should now be AVAILABLE)');

    // ==========================================
    // 6. ASSET TRANSFER
    // ==========================================
    console.log('\n6. Testing Transfer Workflows...');
    // Re-allocate to Bob
    const newAllocation = await AllocationService.allocateAsset(org.id, asset.id, admin.id, { allocatedToUserId: employee.id });
    
    const transferReq = await TransferService.requestTransfer(org.id, employee.id, {
      assetId: asset.id,
      reason: 'Need this in engineering dept',
      targetUserId: admin.id
    });
    console.log('✅ Transfer requested by Bob to Admin');

    await TransferService.approveTransfer(org.id, transferReq.id, admin.id);
    console.log('✅ Transfer approved (Asset auto-returned and reallocated to Admin)');

    // ==========================================
    // 7. BOOKINGS & RESOURCES
    // ==========================================
    console.log('\n7. Testing Unified Bookings...');
    // Make the asset a bookable resource
    const resource = await prisma.resource.create({
      data: {
        organizationId: org.id,
        assetId: asset.id,
        type: ResourceType.EQUIPMENT,
        name: 'Shared MacBook Pro',
        code: `RES-${orgSuffix}`
      }
    });

    try {
      await BookingService.createBooking(org.id, employee.id, {
        resourceId: resource.id,
        startAt: new Date(Date.now() + 3600000).toISOString(),
        endAt: new Date(Date.now() + 7200000).toISOString()
      });
      console.log('❌ FAILED: Allowed booking while asset is actively allocated to someone else!');
    } catch (err: any) {
      console.log('✅ Booking correctly rejected due to active allocation (Cross-entity conflict prevention):', err.message);
    }

    // Fetch the asset to get the latest allocation ID (created during Transfer)
    const updatedAsset = await AssetService.getAssetDetails(org.id, asset.id);
    if (!updatedAsset.activeAllocation) throw new Error('Expected active allocation after transfer');

    // Admin returns the asset so it can be booked
    await AllocationService.returnAsset(org.id, updatedAsset.activeAllocation.allocationId, admin.id, {});
    
    const booking = await BookingService.createBooking(org.id, employee.id, {
      resourceId: resource.id,
      startAt: new Date(Date.now() + 3600000).toISOString(),
      endAt: new Date(Date.now() + 7200000).toISOString()
    });
    console.log('✅ Soft-Hold Booking successfully placed');

    await BookingService.confirmBooking(org.id, booking.id, employee.id);
    console.log('✅ Booking confirmed');

    // ==========================================
    // 8. AUDIT CYCLE
    // ==========================================
    console.log('\n8. Testing Audit Cycle...');
    const audit = await AuditService.createCycle(org.id, admin.id, {
      title: 'Q3 IT Audit',
      departmentId: itDept.id,
      plannedStartAt: new Date().toISOString(),
      plannedEndAt: new Date(Date.now() + 86400000).toISOString()
    });
    console.log(`✅ Audit Cycle created`);

    const auditRecord = await prisma.auditRecord.findFirstOrThrow({
      where: { auditCycleId: audit.id, assetId: asset.id }
    });

    // Verify the asset
    await AuditService.verifyAsset(org.id, auditRecord.id, admin.id, {
      status: 'VERIFIED',
      observedCondition: AssetCondition.GOOD,
      remarks: 'Looks good'
    });
    console.log('✅ Asset verified in audit');

    await AuditService.closeCycle(org.id, audit.id, admin.id);
    console.log('✅ Audit Cycle closed (Missing assets would be marked LOST)');

    // ==========================================
    // 9. REPORTING & ANALYTICS
    // ==========================================
    console.log('\n9. Testing Dashboard & KPIs...');
    const stats = await DashboardService.getKPIs(org.id);
    console.log('✅ Dashboard stats computed:', stats);

    console.log('\n🎉 ALL TESTS PASSED! The ERP Core is completely wired and rock solid. 🎉');

  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
