import { Router } from 'express';
import { requireAuth, requireManager } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';
import { AllocationService } from '../modules/assets/services/allocation.service';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const allocations = await prisma.assetAllocation.findMany({
      where: { asset: { organizationId: orgId } },
      include: {
        asset: true,
        allocatedTo: true,
        allocatedBy: true,
      },
      orderBy: { allocatedAt: 'desc' },
    });
    res.json(allocations);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireManager, async (req, res, next) => {
  try {
    const { assetId, allocatedToUserId, notes } = req.body;
    const allocation = await AllocationService.allocateAsset(
      req.user!.organizationId,
      assetId,
      req.user!.userId,
      { allocatedToUserId, issueNotes: notes }
    );
    res.status(201).json(allocation);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/return', requireManager, async (req, res, next) => {
  try {
    const allocationId = String(req.params.id);
    // Basic implementation for return.
    const allocation = await prisma.assetAllocation.update({
      where: { id: allocationId },
      data: {
        returnedAt: new Date(),
        status: 'RETURNED'
      }
    });
    // Release the active lock
    await prisma.activeAssetAllocation.deleteMany({
      where: { assetId: allocation.assetId }
    });
    await prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' }
    });
    res.json(allocation);
  } catch (error) {
    next(error);
  }
});

export default router;
