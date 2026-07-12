import { Router } from 'express';
import { TransferService } from '../modules/assets/services/transfer.service';
import { requireManager } from '../middleware/auth';

const router = Router();

router.post('/:transferId/approve', requireManager, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const transfer = await TransferService.approveTransfer(
      req.user!.organizationId,
      transferId,
      req.user!.userId
    );
    res.status(200).json(transfer);
  } catch (error: any) {
    next(error);
  }
});

export default router;
