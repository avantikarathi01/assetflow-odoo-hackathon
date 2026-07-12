import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ORG_ID = '1234';
  
  console.log('Cleaning up existing data for org:', ORG_ID);
  
  // Clean up
  await prisma.activityLog.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.notification.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.auditRecord.deleteMany({ where: { auditCycle: { organizationId: ORG_ID } } });
  await prisma.auditCycle.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.maintenanceRequest.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.resourceBooking.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.transferRequest.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.activeAssetAllocation.deleteMany({ where: { asset: { organizationId: ORG_ID } } });
  await prisma.assetAllocation.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.resource.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.asset.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.assetCategory.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.userRole.deleteMany({ where: { user: { organizationId: ORG_ID } } });
  await prisma.user.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.role.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.department.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.location.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.organization.deleteMany({ where: { id: ORG_ID } });

  console.log('Creating Organization...');
  const org = await prisma.organization.create({
    data: {
      id: ORG_ID,
      name: 'AssetFlow Demo Corp',
      slug: 'assetflow-demo',
      timezone: 'UTC',
      currency: 'USD',
    }
  });

  console.log('Creating Locations...');
  const locNY = await prisma.location.create({ data: { organizationId: ORG_ID, name: 'New York HQ', code: 'NY-HQ' } });
  const locSF = await prisma.location.create({ data: { organizationId: ORG_ID, name: 'San Francisco', code: 'SF-BR' } });

  console.log('Creating Departments...');
  const deptIT = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Information Technology', code: 'IT' } });
  const deptHR = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Human Resources', code: 'HR' } });
  const deptEng = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Engineering', code: 'ENG' } });

  console.log('Creating User...');
  const passwordHash = await bcrypt.hash('123456789', 10);
  const user = await prisma.user.create({
    data: {
      organizationId: ORG_ID,
      email: 'test@gmail.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      departmentId: deptIT.id,
      status: 'ACTIVE',
    }
  });

  console.log('Creating Categories...');
  const catLaptop = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Laptops', code: 'LAP' } });
  const catMonitor = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Monitors', code: 'MON' } });
  const catVehicle = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Vehicles', code: 'VEH' } });

  console.log('Creating Assets...');
  const assets = [];
  for (let i = 1; i <= 80; i++) {
    const isLaptop = i <= 40;
    const isMonitor = i > 40 && i <= 70;
    
    let catId = catVehicle.id;
    let name = `Company Car ${i - 70}`;
    if (isLaptop) {
      catId = catLaptop.id;
      name = `MacBook Pro 16" - ${i}`;
    } else if (isMonitor) {
      catId = catMonitor.id;
      name = `Dell UltraSharp 27" - ${i - 40}`;
    }

    const asset = await prisma.asset.create({
      data: {
        organizationId: ORG_ID,
        assetTag: `AST-${i.toString().padStart(4, '0')}`,
        serialNumber: `SN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        name,
        categoryId: catId,
        departmentId: i % 2 === 0 ? deptIT.id : deptEng.id,
        locationId: i % 3 === 0 ? locSF.id : locNY.id,
        status: i % 10 === 0 ? 'UNDER_MAINTENANCE' : 'AVAILABLE',
        createdById: user.id,
        purchaseCost: Math.floor(Math.random() * 2000) + 500,
      }
    });
    assets.push(asset);
  }

  console.log('Creating Allocations...');
  for (let i = 0; i < 20; i++) {
    const asset = assets[i];
    await prisma.asset.update({ where: { id: asset.id }, data: { status: 'ALLOCATED' } });
    
    const allocation = await prisma.assetAllocation.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        allocatedToUserId: user.id,
        allocatedById: user.id,
        status: 'ACTIVE',
      }
    });
    
    await prisma.activeAssetAllocation.create({
      data: {
        assetId: asset.id,
        allocationId: allocation.id
      }
    });
  }

  console.log('Creating Overdue Allocations (for warnings)...');
  for (let i = 20; i < 25; i++) {
    const asset = assets[i];
    await prisma.asset.update({ where: { id: asset.id }, data: { status: 'ALLOCATED' } });
    
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 5);

    const allocation = await prisma.assetAllocation.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        allocatedToUserId: user.id,
        allocatedById: user.id,
        status: 'ACTIVE',
        expectedReturnAt: overdueDate,
      }
    });
    
    await prisma.activeAssetAllocation.create({
      data: {
        assetId: asset.id,
        allocationId: allocation.id
      }
    });
  }

  console.log('Creating Maintenance Requests...');
  for (let i = 25; i < 35; i++) {
    const asset = assets[i];
    await prisma.maintenanceRequest.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        requestedById: user.id,
        issue: 'Screen flickering / hardware issue',
        status: i % 2 === 0 ? 'PENDING' : 'IN_REPAIR',
        priority: i % 3 === 0 ? 'HIGH' : 'MEDIUM',
      }
    });
  }

  console.log('Creating Resources and Bookings...');
  const room = await prisma.resource.create({
    data: {
      organizationId: ORG_ID,
      type: 'ROOM',
      name: 'Conference Room A',
      code: 'CR-A',
      locationId: locNY.id,
      capacity: 10,
    }
  });

  const now = new Date();
  for (let i = 1; i <= 5; i++) {
    const start = new Date(now);
    start.setHours(start.getHours() + i);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    await prisma.resourceBooking.create({
      data: {
        organizationId: ORG_ID,
        resourceId: room.id,
        bookedById: user.id,
        startAt: start,
        endAt: end,
        status: 'CONFIRMED',
        purpose: 'Team Meeting',
      }
    });
  }

  console.log('Creating Activity Logs...');
  for (let i = 0; i < 15; i++) {
    await prisma.activityLog.create({
      data: {
        organizationId: ORG_ID,
        actorId: user.id,
        action: 'CREATED',
        entityType: 'ASSET',
        entityId: assets[i].id,
        reason: 'Initial setup',
        createdAt: new Date(Date.now() - i * 3600000),
      }
    });
  }

  console.log('Creating Transfer Requests...');
  for (let i = 35; i < 40; i++) {
    await prisma.transferRequest.create({
      data: {
        organizationId: ORG_ID,
        assetId: assets[i].id,
        requestedById: user.id,
        targetDepartmentId: deptHR.id,
        reason: 'Needed for new hire in HR',
        status: 'REQUESTED',
      }
    });
  }

  console.log('Creating Audit Cycles...');
  const audit = await prisma.auditCycle.create({
    data: {
      organizationId: ORG_ID,
      title: 'Q3 Annual Asset Audit',
      plannedStartAt: new Date(),
      plannedEndAt: new Date(Date.now() + 7 * 86400000),
      createdById: user.id,
      assignedAuditorId: user.id,
      status: 'IN_PROGRESS',
    }
  });

  for(let i=0; i<10; i++) {
     await prisma.auditRecord.create({
       data: {
         auditCycleId: audit.id,
         assetId: assets[i].id,
         auditorId: user.id,
         status: i % 2 === 0 ? 'VERIFIED' : 'PENDING'
       }
     });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
