import { prisma } from '../src/lib/db/prisma';

const BASE_URL = 'http://localhost:4000';

async function testQueries() {
  console.log('🏁 Starting Query, Audit & Reports HTTP Integration Test...\n');

  const suffix = Date.now();
  const orgName = `Query Corp ${suffix}`;
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const adminEmail = `admin+${suffix}@query.com`;
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
    const adminId = regData.data.user.id;
    console.log(`✅ Registered organization ID: ${orgId}`);

    // Log in as Admin to get Token
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password, organizationSlug: orgSlug })
    });
    const adminToken = ((await adminLoginRes.json() as any).data.token);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
    console.log('✅ Admin logged in successfully.');

    // 2. Setup mock structural data
    console.log('\n2. Setting up category, location, and department...');
    const category = await prisma.assetCategory.create({
      data: { organizationId: orgId, name: 'Laptops', code: `LAPT-${suffix}` }
    });
    const location = await prisma.location.create({
      data: { organizationId: orgId, name: 'HQ', code: `HQ-${suffix}` }
    });
    const department = await prisma.department.create({
      data: { organizationId: orgId, name: 'Engineering', code: `ENG-${suffix}` }
    });
    console.log('✅ Category, location, and department created.');

    // 3. Register Assets
    console.log('\n3. Registering assets...');
    const asset1 = await fetch(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'ThinkPad X1',
        assetTag: `TP-${suffix}`,
        serialNumber: `SN1-${suffix}`,
        categoryId: category.id,
        locationId: location.id,
        departmentId: department.id,
        purchaseCost: 1500
      })
    }).then(r => r.json() as any);

    const asset2 = await fetch(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'MacBook Air',
        assetTag: `MBA-${suffix}`,
        serialNumber: `SN2-${suffix}`,
        categoryId: category.id,
        locationId: location.id,
        departmentId: department.id,
        purchaseCost: 1200
      })
    }).then(r => r.json() as any);
    console.log('✅ Assets registered.');

    // 4. Test Asset Search & Filtering Route
    console.log('\n4. Testing Asset Search/Filter endpoint...');
    const searchRes = await fetch(`${BASE_URL}/api/assets?search=ThinkPad`, { headers });
    const searchData = await searchRes.json() as any[];
    if (searchData.length === 1 && searchData[0].id === asset1.id) {
      console.log('✅ PASS: Filter by search term worked.');
    } else {
      throw new Error(`FAIL: Filter search term returned ${searchData.length} items`);
    }

    const tagRes = await fetch(`${BASE_URL}/api/assets?tag=MBA-${suffix}`, { headers });
    const tagData = await tagRes.json() as any[];
    if (tagData.length === 1 && tagData[0].id === asset2.id) {
      console.log('✅ PASS: Filter by assetTag worked.');
    } else {
      throw new Error(`FAIL: Filter by assetTag returned ${tagData.length} items`);
    }

    // 5. Setup timelines: allocate asset1, raise maintenance
    console.log('\n5. Creating timeline events for asset1...');
    // Create an allocation
    await prisma.assetAllocation.create({
      data: {
        organizationId: orgId,
        assetId: asset1.id,
        allocatedToUserId: adminId,
        allocatedById: adminId,
        status: 'ACTIVE'
      }
    });

    // Create a maintenance request
    await prisma.maintenanceRequest.create({
      data: {
        organizationId: orgId,
        assetId: asset1.id,
        requestedById: adminId,
        issue: 'Battery swelling',
        status: 'PENDING'
      }
    });

    // Fetch history timeline
    const historyRes = await fetch(`${BASE_URL}/api/assets/${asset1.id}/history`, { headers });
    const historyData = await historyRes.json() as any[];
    if (historyData.length >= 2) {
      console.log(`✅ PASS: Combined timeline history contains ${historyData.length} elements.`);
      console.log('   Timeline elements:', historyData.map(t => `[${t.type}] ${t.action}`).join(', '));
    } else {
      throw new Error(`FAIL: History timeline returned insufficient items: ${historyData.length}`);
    }

    // 6. Test Paginated Activity Logs Route
    console.log('\n6. Testing Activity Logs Pagination endpoint...');
    const logsRes = await fetch(`${BASE_URL}/api/activity-logs?page=1&limit=5`, { headers });
    const logsData = await logsRes.json() as any;
    if (logsData.data && logsData.pagination) {
      console.log(`✅ PASS: Activity logs are paginated correctly. Page: ${logsData.pagination.page}, Total: ${logsData.pagination.total}`);
    } else {
      throw new Error(`FAIL: Activity logs pagination shape invalid: ${JSON.stringify(logsData)}`);
    }

    // 7. Test Reports Aggregation Endpoints
    console.log('\n7. Testing Reports Aggregation Endpoints...');

    // utilization
    const utilRes = await fetch(`${BASE_URL}/api/reports/utilization`, { headers });
    const utilData = await utilRes.json() as any;
    if (utilData.mostUsed && utilData.leastUsed) {
      console.log('✅ PASS: /api/reports/utilization returned most/least used assets list.');
    } else {
      throw new Error('FAIL: /api/reports/utilization output shape invalid');
    }

    // maintenance-frequency
    const maintFreqRes = await fetch(`${BASE_URL}/api/reports/maintenance-frequency`, { headers });
    const maintFreqData = await maintFreqRes.json() as any[];
    if (Array.isArray(maintFreqData)) {
      console.log(`✅ PASS: /api/reports/maintenance-frequency returned categories grouped maintenance costs.`);
    } else {
      throw new Error('FAIL: /api/reports/maintenance-frequency output must be an array');
    }

    // department-summary
    const deptSumRes = await fetch(`${BASE_URL}/api/reports/department-summary`, { headers });
    const deptSumData = await deptSumRes.json() as any[];
    if (Array.isArray(deptSumData)) {
      console.log(`✅ PASS: /api/reports/department-summary returned list of departments stats.`);
    } else {
      throw new Error('FAIL: /api/reports/department-summary output must be an array');
    }

    // booking-heatmap
    const heatmapRes = await fetch(`${BASE_URL}/api/reports/booking-heatmap`, { headers });
    const heatmapData = await heatmapRes.json() as any[];
    if (Array.isArray(heatmapData)) {
      console.log(`✅ PASS: /api/reports/booking-heatmap returned heatmap dataset.`);
    } else {
      throw new Error('FAIL: /api/reports/booking-heatmap output must be an array');
    }

    console.log('\n🎉 ALL READ & REPORTS ENDPOINTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
    process.exit(1);
  }
}

testQueries();
