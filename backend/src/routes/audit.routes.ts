import { Router } from 'express';
import { AuditService } from '../modules/audit/services/audit.service';
import { requireAuth, requireAdmin, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

// Get all audit cycles for an organization
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const cycles = await prisma.auditCycle.findMany({
      where: { organizationId: orgId },
      include: {
        records: {
          include: {
            asset: true,
            auditor: true
          }
        }
      },
      orderBy: { plannedStartAt: 'desc' }
    });
    
    // Compute summaries on the fly
    const mapped = cycles.map(c => {
      const verified = c.records.length;
      const discrepancies = c.records.filter(r => r.outcome === 'DISCREPANCY').length;
      return {
        ...c,
        total: 100, // Normally this would be total assets in scope
        verified,
        discrepancies,
      };
    });
    
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

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
