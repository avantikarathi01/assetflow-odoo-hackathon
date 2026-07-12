import { prisma } from '../src/lib/db/prisma';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:4000';

async function testRBAC() {
  console.log('🏁 Starting RBAC & Claimability HTTP Integration Test...\n');

  const suffix = Date.now();
  const orgName = `RBAC Corp ${suffix}`;
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const adminEmail = `admin+${suffix}@rbac.com`;
  const employeeEmail = `emp+${suffix}@rbac.com`;
  const password = 'password123';

  try {
    // 1. Register Admin/Org
    console.log('1. Registering Admin and Organization...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password,
        firstName: 'Alice',
        lastName: 'Admin',
        organizationName: orgName
      })
    });
    
    if (!regRes.ok) {
      throw new Error(`Failed to register: ${await regRes.text()}`);
    }
    const regData = await regRes.json() as any;
    const orgId = regData.data.organization.id;
    console.log(`✅ Registered organization ID: ${orgId}`);

    // Log in as Admin to get Token
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password, organizationSlug: orgSlug })
    });
    const adminToken = ((await adminLoginRes.json() as any).data.token);
    const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
    console.log('✅ Admin logged in successfully.');

    // 2. Create Employee user in database
    console.log('2. Creating standard employee...');
    const hashedPassword = await bcrypt.hash(password, 12);
    const employeeUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        firstName: 'Bob',
        lastName: 'Employee',
        email: employeeEmail,
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      }
    });
    console.log(`✅ Employee user created with ID: ${employeeUser.id}`);

    // Log in as Employee to get Token
    const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: employeeEmail, password, organizationSlug: orgSlug })
    });
    const empToken = ((await empLoginRes.json() as any).data.token);
    const empHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` };
    console.log('✅ Employee logged in successfully.');

    // 3. Test Promo Endpoint
    console.log('\n3. Testing Employee Promotion Endpoint...');
    // Attempt promotion as Employee (should fail with 403)
    const badPromoRes = await fetch(`${BASE_URL}/api/auth/users/${employeeUser.id}/promote`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ role: 'AUDITOR' })
    });
    if (badPromoRes.status === 403) {
      console.log('✅ PASS: Employee block on promotion endpoint (403 Forbidden).');
    } else {
      throw new Error(`FAIL: Employee promotion endpoint returned ${badPromoRes.status} instead of 403`);
    }

    // 4. Test Audit Verification Endpoint
    console.log('\n4. Testing Audit Verification Endpoint...');
    // Create audit cycle
    const cycle = await prisma.auditCycle.create({
      data: {
        organizationId: orgId,
        title: 'Q3 Audit',
        plannedStartAt: new Date(),
        plannedEndAt: new Date(Date.now() + 86400000),
        createdById: employeeUser.id
      }
    });

    const category = await prisma.assetCategory.create({
      data: { organizationId: orgId, name: 'Devices', code: `DEV-${suffix}` }
    });
    const loc = await prisma.location.create({
      data: { organizationId: orgId, name: 'Office', code: `OFF-${suffix}` }
    });
    const dept = await prisma.department.create({
      data: { organizationId: orgId, name: 'Ops', code: `OPS-${suffix}` }
    });

    const asset = await prisma.asset.create({
      data: {
        organizationId: orgId,
        assetTag: `TAG-${suffix}`,
        serialNumber: `SN-${suffix}`,
        name: 'Office Phone',
        categoryId: category.id,
        locationId: loc.id,
        departmentId: dept.id,
        createdById: employeeUser.id
      }
    });

    const record = await prisma.auditRecord.create({
      data: {
        auditCycleId: cycle.id,
        assetId: asset.id,
        auditorId: employeeUser.id
      }
    });

    // Test verify endpoint as Employee without auditor role
    const badVerifyRes = await fetch(`${BASE_URL}/api/audits/verify/${record.id}`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ status: 'VERIFIED' })
    });
    if (badVerifyRes.status === 403) {
      console.log('✅ PASS: Employee without role blocked from verification (403 Forbidden).');
    } else {
      throw new Error(`FAIL: Verification not blocked (returned ${badVerifyRes.status})`);
    }

    // Now, Promote as Admin (should succeed)
    const goodPromoRes = await fetch(`${BASE_URL}/api/auth/users/${employeeUser.id}/promote`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ role: 'AUDITOR' })
    });
    if (goodPromoRes.ok) {
      console.log('✅ PASS: Admin successfully promoted Employee to AUDITOR (200 OK).');
    } else {
      throw new Error(`FAIL: Admin promotion failed: ${await goodPromoRes.text()}`);
    }

    // Refresh Auditor token to get the new role loaded into payload
    const auditorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: employeeEmail, password, organizationSlug: orgSlug })
    });
    const auditorToken = ((await auditorLoginRes.json() as any).data.token);
    const auditorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${auditorToken}` };

    // Test verify endpoint with Auditor role (new token)
    const goodVerifyRes = await fetch(`${BASE_URL}/api/audits/verify/${record.id}`, {
      method: 'POST',
      headers: auditorHeaders,
      body: JSON.stringify({ status: 'VERIFIED' })
    });
    if (goodVerifyRes.ok) {
      console.log('✅ PASS: Auditor successfully verified the record.');
    } else {
      throw new Error(`FAIL: Auditor verification failed: ${await goodVerifyRes.text()}`);
    }

    // 5. Test Maintenance Resolve Endpoint
    console.log('\n5. Testing Maintenance Resolve Endpoint...');
    // Create maintenance request
    const maintReq = await prisma.maintenanceRequest.create({
      data: {
        organizationId: orgId,
        assetId: asset.id,
        requestedById: employeeUser.id,
        issue: 'Screen cracked',
        status: 'PENDING'
      }
    });

    // Create a technician user
    const techUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        firstName: 'Tom',
        lastName: 'Technician',
        email: `tech+${suffix}@rbac.com`,
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      }
    });

    // Promote to TECHNICIAN
    await prisma.role.create({
      data: {
        organizationId: orgId,
        name: 'TECHNICIAN',
        description: 'Tech'
      }
    }).then(async (r) => {
      await prisma.userRole.create({ data: { userId: techUser.id, roleId: r.id } });
    });

    // Log in as Technician
    const techLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `tech+${suffix}@rbac.com`, password, organizationSlug: orgSlug })
    });
    const techToken = ((await techLoginRes.json() as any).data.token);
    const techHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${techToken}` };

    // Approve & Assign request
    await prisma.maintenanceRequest.update({
      where: { id: maintReq.id },
      data: { status: 'ASSIGNED', assignedTechnicianId: techUser.id }
    });

    // Attempt to resolve as Auditor (should return 403)
    const badMaintResolve = await fetch(`${BASE_URL}/api/maintenance/${maintReq.id}/resolve`, {
      method: 'POST',
      headers: auditorHeaders,
      body: JSON.stringify({ resolutionNotes: 'Fixed it' })
    });
    if (badMaintResolve.status === 403) {
      console.log('✅ PASS: Unauthorized user blocked from resolving maintenance (403 Forbidden).');
    } else {
      throw new Error(`FAIL: Resolve not blocked (returned ${badMaintResolve.status})`);
    }

    // Resolve as assigned Technician (should succeed)
    const goodMaintResolve = await fetch(`${BASE_URL}/api/maintenance/${maintReq.id}/resolve`, {
      method: 'POST',
      headers: techHeaders,
      body: JSON.stringify({ resolutionNotes: 'Repaired screen', cost: 150 })
    });
    if (goodMaintResolve.ok) {
      console.log('✅ PASS: Assigned technician successfully resolved maintenance.');
    } else {
      throw new Error(`FAIL: Technician resolve failed: ${await goodMaintResolve.text()}`);
    }

    console.log('\n🎉 ALL RBAC & SECURITY TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
    process.exit(1);
  }
}

testRBAC();
