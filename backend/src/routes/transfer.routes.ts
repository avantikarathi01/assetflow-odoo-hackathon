import { Router } from 'express';
import { TransferService } from '../modules/assets/services/transfer.service';
import { requireAuth, requireTransferApprovalAccess } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

router.post('/:transferId/approve', requireTransferApprovalAccess, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const transfer = await TransferService.approveTransfer(
      req.user!.organizationId,
      transferId as string,
      req.user!.userId
    );
    res.status(200).json(transfer);
  } catch (error: any) {
    next(error);
  }
});

router.post('/:transferId/reject', requireTransferApprovalAccess, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const { reason } = req.body;
    const transfer = await TransferService.rejectTransfer(
      req.user!.organizationId,
      transferId as string,
      req.user!.userId,
      reason
    );
    res.status(200).json(transfer);
  } catch (error: any) {
    next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const transfers = await prisma.transferRequest.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { asset: true, requestedBy: true, targetUser: true, targetDepartment: true, targetLocation: true },
      orderBy: { requestedAt: 'desc' }
    });
    res.json(transfers);
  } catch (error: any) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = req.body;
    const transfer = await TransferService.requestTransfer(
      req.user!.organizationId,
      req.user!.userId,
      data
    );
    res.status(201).json(transfer);
  } catch (error: any) {
    next(error);
  }
});

export default router;
