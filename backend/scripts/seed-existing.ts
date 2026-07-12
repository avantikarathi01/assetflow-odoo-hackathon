import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: '1234' } });
  if (!org) {
    console.error("Org with slug 1234 not found");
    return;
  }
  const ORG_ID = org.id;
  console.log('Seeding existing org:', ORG_ID);

  // We should fetch an existing admin user
  const adminUser = await prisma.user.findFirst({ where: { organizationId: ORG_ID, email: 'test@gmail.com' } });
  if (!adminUser) {
     console.error("test@gmail.com not found in this org");
     return;
  }

  console.log('Cleaning up existing data...');
  // Delete everything except the organization, admin user, and roles
  await prisma.auditRecord.deleteMany({ where: { auditCycle: { organizationId: ORG_ID } } });
  await prisma.auditCycle.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.activityLog.deleteMany({ where: { organizationId: ORG_ID, actorId: { not: adminUser.id } } });
  await prisma.transferRequest.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.resourceBooking.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.resource.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.maintenanceRequest.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.activeAssetAllocation.deleteMany({ where: { asset: { organizationId: ORG_ID } } });
  await prisma.assetAllocation.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.asset.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.assetCategory.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.userRole.deleteMany({ where: { user: { organizationId: ORG_ID, id: { not: adminUser.id } } } });
  await prisma.user.deleteMany({ where: { organizationId: ORG_ID, id: { not: adminUser.id } } });
  await prisma.department.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.location.deleteMany({ where: { organizationId: ORG_ID } });

  console.log('Fetching roles...');
  const managerRole = await prisma.role.findFirst({ where: { organizationId: ORG_ID, name: 'MANAGER' } });
  const employeeRole = await prisma.role.findFirst({ where: { organizationId: ORG_ID, name: 'EMPLOYEE' } });

  console.log('Creating Locations...');
  const locNY = await prisma.location.create({ data: { organizationId: ORG_ID, name: 'New York HQ', code: 'NY-HQ-' + Date.now() } });
  const locSF = await prisma.location.create({ data: { organizationId: ORG_ID, name: 'San Francisco', code: 'SF-BR-' + Date.now() } });
  const locLDN = await prisma.location.create({ data: { organizationId: ORG_ID, name: 'London Office', code: 'LDN-' + Date.now() } });

  console.log('Creating Departments...');
  const deptIT = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Information Technology', code: 'IT-' + Date.now() } });
  const deptHR = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Human Resources', code: 'HR-' + Date.now() } });
  const deptEng = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Engineering', code: 'ENG-' + Date.now() } });
  const deptSales = await prisma.department.create({ data: { organizationId: ORG_ID, name: 'Sales', code: 'SLS-' + Date.now() } });
  
  const depts = [deptIT, deptHR, deptEng, deptSales];

  console.log('Creating Employees...');
  const users = [adminUser];
  const firstNames = ["James", "Maria", "David", "Linda", "Michael", "Sarah", "William", "Jessica", "Richard", "Emily", "Joseph", "Amanda", "Thomas", "Melissa", "Charles", "Ashley"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"];
  
  const passHash = await bcrypt.hash("password123", 10);
  
  for(let i = 0; i < 20; i++) {
    const isManager = i < 4;
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const u = await prisma.user.create({
      data: {
        organizationId: ORG_ID,
        firstName: fName,
        lastName: lName,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@assetflow.com`,
        passwordHash: passHash,
        departmentId: depts[i % depts.length].id,
      }
    });
    
    if (isManager && managerRole) {
      await prisma.userRole.create({ data: { userId: u.id, roleId: managerRole.id } });
    } else if (employeeRole) {
      await prisma.userRole.create({ data: { userId: u.id, roleId: employeeRole.id } });
    }
    users.push(u);
  }

  console.log('Creating Categories...');
  const catLaptop = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Laptops', code: 'LAP-' + Date.now() } });
  const catMonitor = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Monitors', code: 'MON-' + Date.now() } });
  const catVehicle = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Vehicles', code: 'VEH-' + Date.now() } });
  const catPhone = await prisma.assetCategory.create({ data: { organizationId: ORG_ID, name: 'Phones', code: 'PHN-' + Date.now() } });

  console.log('Creating Assets...');
  const assets = [];
  for (let i = 1; i <= 80; i++) {
    const isLaptop = i <= 30;
    const isMonitor = i > 30 && i <= 60;
    const isPhone = i > 60 && i <= 75;
    
    let catId = catVehicle.id;
    let name = `Company Car ${i - 75}`;
    if (isLaptop) {
      catId = catLaptop.id;
      name = `MacBook Pro 16" - ${i}`;
    } else if (isMonitor) {
      catId = catMonitor.id;
      name = `Dell UltraSharp 27" - ${i - 30}`;
    } else if (isPhone) {
      catId = catPhone.id;
      name = `iPhone 15 Pro - ${i - 60}`;
    }

    const asset = await prisma.asset.create({
      data: {
        organizationId: ORG_ID,
        assetTag: `AST-${i.toString().padStart(4, '0')}-${Date.now()}`,
        serialNumber: `SN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        name,
        categoryId: catId,
        departmentId: depts[i % depts.length].id,
        locationId: i % 3 === 0 ? locSF.id : (i % 2 === 0 ? locNY.id : locLDN.id),
        status: i % 10 === 0 ? 'UNDER_MAINTENANCE' : 'AVAILABLE',
        createdById: adminUser.id,
        purchaseCost: Math.floor(Math.random() * 2000) + 500,
      }
    });
    assets.push(asset);
  }

  console.log('Creating Allocations...');
  for (let i = 0; i < 40; i++) {
    const asset = assets[i];
    const assignee = users[i % users.length];
    
    await prisma.asset.update({ where: { id: asset.id }, data: { status: 'ALLOCATED' } });
    
    const allocation = await prisma.assetAllocation.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        allocatedToUserId: assignee.id,
        allocatedById: adminUser.id,
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

  console.log('Creating Overdue and Upcoming Allocations...');
  for (let i = 40; i < 50; i++) {
    const asset = assets[i];
    const assignee = users[i % users.length];
    await prisma.asset.update({ where: { id: asset.id }, data: { status: 'ALLOCATED' } });
    
    const targetDate = new Date();
    if (i < 45) {
      // Overdue (past)
      targetDate.setDate(targetDate.getDate() - 5);
    } else {
      // Upcoming (future)
      targetDate.setDate(targetDate.getDate() + (i - 44));
    }

    const allocation = await prisma.assetAllocation.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        allocatedToUserId: assignee.id,
        allocatedById: adminUser.id,
        status: 'ACTIVE',
        expectedReturnAt: targetDate,
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
  for (let i = 50; i < 60; i++) {
    const asset = assets[i];
    const requester = users[(i + 2) % users.length];
    const targetDate = new Date();
    // Spread over next 5 days
    targetDate.setDate(targetDate.getDate() + (i % 5));
    
    await prisma.maintenanceRequest.create({
      data: {
        organizationId: ORG_ID,
        assetId: asset.id,
        requestedById: requester.id,
        issue: 'Hardware issue reported',
        status: i % 2 === 0 ? 'PENDING' : 'IN_REPAIR',
        priority: i % 3 === 0 ? 'HIGH' : 'MEDIUM',
        createdAt: targetDate,
      }
    });
  }

  console.log('Creating Resources and Bookings...');
  const room = await prisma.resource.create({
    data: {
      organizationId: ORG_ID,
      type: 'ROOM',
      name: 'Conference Room A',
      code: 'CR-A-' + Date.now(),
      locationId: locNY.id,
      capacity: 10,
    }
  });

  const now = new Date();
  for (let i = 1; i <= 20; i++) {
    const start = new Date(now);
    start.setDate(start.getDate() + (i % 5)); // spread over 5 days
    start.setHours(9 + (i % 8)); // 9 AM to 4 PM
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const booker = users[i % users.length];

    await prisma.resourceBooking.create({
      data: {
        organizationId: ORG_ID,
        resourceId: room.id,
        bookedById: booker.id,
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
        actorId: adminUser.id,
        action: 'CREATED',
        entityType: 'ASSET',
        entityId: assets[i].id,
        reason: 'Initial setup',
        createdAt: new Date(Date.now() - i * 3600000),
      }
    });
  }

  console.log('Creating Transfer Requests...');
  for (let i = 60; i < 65; i++) {
    const requester = users[i % users.length];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (i % 5));

    await prisma.transferRequest.create({
      data: {
        organizationId: ORG_ID,
        assetId: assets[i].id,
        requestedById: requester.id,
        targetDepartmentId: deptHR.id,
        reason: 'Needed for new hire in HR',
        status: 'REQUESTED',
        requestedAt: targetDate,
      }
    });
  }

  console.log('Creating Audit Cycles...');
  for(let a=1; a<=3; a++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + a * 2); // 2, 4, 6 days from now
    
    const audit = await prisma.auditCycle.create({
      data: {
        organizationId: ORG_ID,
        title: `Asset Audit Phase ${a}`,
        plannedStartAt: targetDate,
        plannedEndAt: new Date(targetDate.getTime() + 7 * 86400000),
        createdById: adminUser.id,
        assignedAuditorId: adminUser.id,
        status: a === 1 ? 'IN_PROGRESS' : 'OPEN',
      }
    });

    for(let i=0; i<5; i++) {
       await prisma.auditRecord.create({
         data: {
           auditCycleId: audit.id,
           assetId: assets[a*5 + i].id,
           auditorId: adminUser.id,
           status: i % 2 === 0 ? 'VERIFIED' : 'PENDING'
         }
       });
    }
  }

  console.log('Seeding completed successfully for existing org!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
