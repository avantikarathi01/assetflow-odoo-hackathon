// scripts/test-concurrency.ts
// Run with: npx ts-node scripts/test-concurrency.ts

import { prisma } from '../src/lib/db/prisma';
import { AllocationService } from '../src/modules/assets/services/allocation.service';
import crypto from 'crypto';

async function setup() {
  console.log('Setting up mock data...');
  // 1. Create Org
  const org = await prisma.organization.create({
    data: { name: 'Test Org', slug: `test-org-${Date.now()}` }
  });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      passwordHash: 'hash'
    }
  });

  // 3. Create Department & Category & Location
  const dept = await prisma.department.create({ data: { organizationId: org.id, name: 'IT', code: 'IT' } });
  const cat = await prisma.assetCategory.create({ data: { organizationId: org.id, name: 'Laptops', code: 'LAPT' } });
  const loc = await prisma.location.create({ data: { organizationId: org.id, name: 'HQ', code: 'HQ' } });

  // 4. Create Asset
  const asset = await prisma.asset.create({
    data: {
      organizationId: org.id,
      assetTag: `TAG-${Date.now()}`,
      serialNumber: `SN-${Date.now()}`,
      name: 'MacBook Pro',
      categoryId: cat.id,
      departmentId: dept.id,
      locationId: loc.id,
      createdById: user.id
    }
  });

  return { orgId: org.id, userId: user.id, assetId: asset.id };
}

async function runTest() {
  const { orgId, userId, assetId } = await setup();
  console.log(`Setup complete. Firing 20 simultaneous allocation requests for asset ${assetId}...`);

  const requests = Array.from({ length: 20 }, async (_, i) => {
    try {
      // Simulate direct service call since we are bypassing the Next.js HTTP layer for the script
      const result = await AllocationService.allocateAsset(orgId, assetId, userId, { allocatedToUserId: userId });
      return { status: 200, result };
    } catch (err: any) {
      return { status: err.statusCode || 500, error: err.message };
    }
  });

  const results = await Promise.all(requests);

  const successCount = results.filter(r => r.status === 200).length;
  const conflictCount = results.filter(r => r.status === 409).length;
  const otherCount = results.length - successCount - conflictCount;

  console.log('\n--- CONCURRENCY TEST RESULTS ---');
  console.log(`Total Requests Sent: ${requests.length}`);
  console.log(`Successful Allocations: ${successCount} (Should be EXACTLY 1)`);
  console.log(`Conflict Rejections (409): ${conflictCount} (Should be 19)`);
  if (otherCount > 0) {
    console.log(`Other Errors: ${otherCount}`);
  }

  if (successCount === 1 && conflictCount === 19) {
    console.log('\n✅ TEST PASSED: Atomic locking successfully prevented race conditions.');
  } else {
    console.log('\n❌ TEST FAILED: Race condition detected.');
  }

  process.exit(0);
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});
