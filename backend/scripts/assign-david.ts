import { PrismaClient, AssetStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const david = await prisma.user.findFirst({
    where: { email: 'david.smith4@assetflow.com' }
  });

  if (!david) {
    console.log("Could not find user david.smith4@assetflow.com");
    return;
  }
  
  const orgId = david.organizationId;
  console.log(`Found David with ID: ${david.id} in Org: ${orgId}`);

  // Find 2 available assets
  const availableAssets = await prisma.asset.findMany({
    where: {
      organizationId: orgId,
      status: AssetStatus.AVAILABLE,
      isAllocatable: true
    },
    take: 2
  });

  if (availableAssets.length === 0) {
    console.log("No available assets to assign!");
    return;
  }

  // Assign them
  for (const asset of availableAssets) {
    const allocation = await prisma.assetAllocation.create({
      data: {
        organizationId: orgId,
        assetId: asset.id,
        allocatedToUserId: david.id,
        allocatedById: david.id, // self allocated for demo purposes or admin
        status: 'ACTIVE'
      }
    });

    await prisma.activeAssetAllocation.create({
      data: {
        assetId: asset.id,
        allocationId: allocation.id
      }
    });

    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: AssetStatus.ALLOCATED }
    });

    console.log(`Assigned Asset: ${asset.name} (Tag: ${asset.assetTag}) to David`);
  }
  
  console.log("Assignment complete!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
