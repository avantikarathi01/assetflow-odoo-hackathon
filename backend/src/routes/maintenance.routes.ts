import { Router } from 'express';
import { MaintenanceService } from '../modules/maintenance/services/maintenance.service';
import { requireAuth, requireManager, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

// Get all maintenance requests (from Frontend)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const maintenance = await prisma.maintenanceRequest.findMany({
      where: { asset: { organizationId: orgId } },
      include: {
        asset: true,
        requestedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    // Transform to match frontend expected fields
    const formatted = maintenance.map(m => ({
      ...m,
      reportedByUser: m.requestedBy,
      reportedAt: m.createdAt,
      description: m.issue
    }));
    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Create new maintenance request (from Frontend)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { assetId, issue, priority } = req.body;
    const record = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        issue,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        requestedById: req.user!.userId,
        organizationId: req.user!.organizationId,
      }
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

// Update maintenance status (from Frontend)
router.patch('/:id/status', requireManager, async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    const record = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { status, resolutionNotes }
    });
    
    // If completed, update asset status back to AVAILABLE
    if (status === 'RESOLVED') {
      await prisma.asset.update({
        where: { id: record.assetId },
        data: { status: 'AVAILABLE' }
      });
    } else if (status === 'IN_REPAIR') {
      await prisma.asset.update({
        where: { id: record.assetId },
        data: { status: 'UNDER_MAINTENANCE' }
      });
    }

    res.json(record);
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
