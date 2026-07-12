import { Router } from 'express';
import { MaintenanceService } from '../modules/maintenance/services/maintenance.service';
import { requireManager, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

// Raise a maintenance request (any user)
router.post('/', async (req, res, next) => {
  try {
    const request = await MaintenanceService.raiseRequest(
      req.user!.organizationId,
      req.user!.userId,
      req.body
    );
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// Approve request (Asset Manager+)
router.post('/:requestId/approve', requireManager, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await MaintenanceService.approveRequest(
      req.user!.organizationId,
      requestId as string,
      req.user!.userId,
      req.body
    );
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Reject request (Asset Manager+)
router.post('/:requestId/reject', requireManager, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await MaintenanceService.rejectRequest(
      req.user!.organizationId,
      requestId as string,
      req.user!.userId,
      req.body
    );
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Assign technician (Asset Manager+)
router.post('/:requestId/assign', requireManager, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { technicianId } = req.body;
    const request = await MaintenanceService.assignTechnician(
      req.user!.organizationId,
      requestId as string,
      technicianId,
      req.user!.userId
    );
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Resolve request (Asset Manager or Technician)
router.post('/:requestId/resolve', requireRole('ADMIN', 'MANAGER', 'TECHNICIAN'), async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, organizationId: req.user!.organizationId }
    });

    if (!maintenanceRequest) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    const isTech = maintenanceRequest.assignedTechnicianId === req.user!.userId;
    const isManagerOrAdmin = req.user!.roles.includes('ADMIN') || req.user!.roles.includes('MANAGER');

    if (!isTech && !isManagerOrAdmin) {
      return res.status(403).json({ error: 'Forbidden: You must be the assigned technician or an Asset Manager to resolve this request' });
    }

    const request = await MaintenanceService.resolveRequest(
      req.user!.organizationId,
      requestId as string,
      req.user!.userId,
      req.body
    );
    res.json(request);
  } catch (error) {
    next(error);
  }
});

export default router;
