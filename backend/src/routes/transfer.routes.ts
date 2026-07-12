import { Router } from 'express';
import { TransferService } from '../modules/assets/services/transfer.service';
import { requireTransferApprovalAccess } from '../middleware/auth';

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

router.post('/', async (req, res, next) => {
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
