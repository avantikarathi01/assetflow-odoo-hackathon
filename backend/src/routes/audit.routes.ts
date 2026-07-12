import { Router } from 'express';
import { AuditService } from '../modules/audit/services/audit.service';
import { requireAdmin, requireRole } from '../middleware/auth';

const router = Router();

// Create audit cycle (Admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const cycle = await AuditService.createCycle(
      req.user!.organizationId,
      req.user!.userId,
      req.body
    );
    res.status(201).json(cycle);
  } catch (error) {
    next(error);
  }
});

// Verify asset in audit (Auditors / Admins / Managers)
router.post('/verify/:recordId', requireRole('ADMIN', 'MANAGER', 'AUDITOR'), async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const record = await AuditService.verifyAsset(
      req.user!.organizationId,
      recordId,
      req.user!.userId,
      req.body
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
});

// Close audit cycle (Admin only)
router.post('/:cycleId/close', requireAdmin, async (req, res, next) => {
  try {
    const { cycleId } = req.params;
    const { forceClose } = req.body;
    const result = await AuditService.closeCycle(
      req.user!.organizationId,
      cycleId as string,
      req.user!.userId,
      forceClose === true
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
