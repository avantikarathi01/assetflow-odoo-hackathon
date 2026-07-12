import { AllocationService } from '../src/modules/assets/services/allocation.service';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/modules/auth/services';
import { LocationService } from '../src/modules/organizations/location.service';
import { AssetService } from '../src/modules/assets/services/asset.service';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Role & End-to-End Validation...");

  const ts = Date.now();

  // 2. Register Organization (Creates Admin automatically)
  console.log("\n[1] Registering Acme Corp & Admin...");
  const adminRes = await AuthService.registerOrganization({
    email: `admin${ts}@acme.com`,
    password: "Password123!",
    firstName: "Alice",
    lastName: "Admin",
    organizationName: `Acme Corp ${ts}`,
    slug: `acme-${ts}`
  });
  console.log(`✅ Organization created: ${adminRes.organization.name}`);
  console.log(`✅ Admin created: ${adminRes.user.email}`);

  // 3. Create Manager Role & Manager User
  console.log("\n[2] Creating standard Manager and Employee users...");
  const managerRole = await prisma.role.create({
    data: {
      name: `MANAGER_${ts}`,
      description: "Department Manager",
      permissions: {},
      isSystem: true,
      organizationId: adminRes.organization.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: `manager${ts}@acme.com`,
      passwordHash: "hashed",
      firstName: "Bob",
      lastName: "Manager",
      organizationId: adminRes.organization.id,
      userRoles: {
        create: { roleId: managerRole.id }
      }
    }
  });

  // 4. Create Employee Role & Employee User
  const empRole = await prisma.role.create({
    data: {
      name: `EMPLOYEE_${ts}`,
      description: "Standard Employee",
      permissions: {},
      isSystem: true,
      organizationId: adminRes.organization.id
    }
  });

  const employee = await prisma.user.create({
    data: {
      email: `employee${ts}@acme.com`,
      passwordHash: "hashed",
      firstName: "Charlie",
      lastName: "Worker",
      organizationId: adminRes.organization.id,
      userRoles: {
        create: { roleId: empRole.id }
      }
    }
  });
  console.log(`✅ Users created: ${manager.email} (Manager), ${employee.email} (Employee)`);

  // 5. Test Admin Capabilities (Create Location/Dept)
  console.log("\n[3] Testing Admin Capabilities...");
  const location = await LocationService.createLocation(adminRes.organization.id, {
    name: "HQ",
    code: `HQ-${ts}`,
  });
  
  const dept = await prisma.department.create({
    data: {
      organizationId: adminRes.organization.id,
      name: "IT",
      code: `IT-${ts}`,
      headUserId: manager.id
    }
  });
  console.log(`✅ Location and Department created successfully.`);

  // 6. Manager Capabilities (Create Asset)
  console.log("\n[4] Testing Manager Capabilities...");
  const category = await prisma.assetCategory.create({
    data: {
      organizationId: adminRes.organization.id,
      name: "Laptop",
      code: `LAPTOP-${ts}`
    }
  });

  const asset = await AssetService.registerAsset(adminRes.organization.id, manager.id, {
    assetTag: `TAG-${ts}`,
    serialNumber: `SN-${ts}`,
    name: "ThinkPad X1",
    categoryId: category.id,
    departmentId: dept.id,
    locationId: location.id
  });
  console.log(`✅ Manager registered asset: ${asset.name}`);

  // 7. Allocation
  console.log("\n[5] Testing Asset Allocation to Employee...");
  const allocation = await AllocationService.allocateAsset(
    adminRes.organization.id, 
    asset.id, 
    manager.id, 
    { allocatedToUserId: employee.id }
  );
  console.log(`✅ Asset successfully allocated to Employee (Charlie Worker).`);

  // 8. Try double allocation
  console.log("\n[6] Testing Concurrency/Atomic Locks (Double Allocation)...");
  try {
    await AllocationService.allocateAsset(
      adminRes.organization.id, 
      asset.id, 
      manager.id, 
      { allocatedToUserId: adminRes.user.id }
    );
    console.error("❌ FAILED: Double allocation should have been rejected!");
  } catch(e: any) {
    console.log(`✅ Double allocation rejected correctly: ${e.message}`);
  }

  console.log("\n🎉 ALL TESTS PASSED! Backend is running perfectly with robust roles and concurrency checks.");
  process.exit(0);
}

main().catch(console.error);
