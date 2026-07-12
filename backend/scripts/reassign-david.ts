import { PrismaClient, AssetStatus, AllocationStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const david = await prisma.user.findFirst({
    where: { email: 'david.smith4@assetflow.com' }
  });

  if (!david) {
    console.log("Could not find user david");
    return;
  }
  
  const orgId = david.organizationId;
  console.log(`Found David with ID: ${david.id}`);

  // 1. Find all active allocations for David
  const activeAllocs = await prisma.assetAllocation.findMany({
    where: {
      allocatedToUserId: david.id,
      status: 'ACTIVE'
    }
  });

  console.log(`Found ${activeAllocs.length} active allocations to remove.`);

  for (const alloc of activeAllocs) {
    // Delete the active lock
    await prisma.activeAssetAllocation.deleteMany({
      where: { allocationId: alloc.id }
    });
    
    // Mark allocation as returned
    await prisma.assetAllocation.update({
      where: { id: alloc.id },
      data: { status: 'RETURNED', returnedAt: new Date() }
    });

    // Mark asset as AVAILABLE
    await prisma.asset.update({
      where: { id: alloc.assetId },
      data: { status: AssetStatus.AVAILABLE }
    });
  }

  // 2. Find one MacBook
  const macbook = await prisma.asset.findFirst({
    where: {
      organizationId: orgId,
      name: { contains: 'MacBook' },
      status: AssetStatus.AVAILABLE,
      isAllocatable: true
    }
  });

  if (!macbook) {
    console.log("No available MacBook found!");
    return;
  }

  // 3. Assign the MacBook
  const newAlloc = await prisma.assetAllocation.create({
    data: {
      organizationId: orgId,
      assetId: macbook.id,
      allocatedToUserId: david.id,
      allocatedById: david.id,
      status: 'ACTIVE'
    }
  });

  await prisma.activeAssetAllocation.create({
    data: {
      assetId: macbook.id,
      allocationId: newAlloc.id
    }
  });

  await prisma.asset.update({
    where: { id: macbook.id },
    data: { status: AssetStatus.ALLOCATED }
  });

  console.log(`Successfully assigned 1 ${macbook.name} (Tag: ${macbook.assetTag}) to David.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
