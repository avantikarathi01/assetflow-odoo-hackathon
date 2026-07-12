import { Router } from 'express';
import { AssetService } from '../modules/assets/services/asset.service';
import { requireManager } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';
import { AssetStatus } from '@prisma/client';

const router = Router();

// Register asset (Asset Manager+)
router.post('/', requireManager, async (req, res, next) => {
  try {
    const data = req.body;
    const asset = await AssetService.registerAsset(
      req.user!.organizationId,
      req.user!.userId,
      data
    );
    res.status(201).json(asset);
  } catch (error: any) {
    next(error);
  }
});

// Search and filter assets (All users, results scoped to org)
router.get('/', async (req, res, next) => {
  try {
    const { tag, serialNumber, categoryId, status, departmentId, locationId, search } = req.query;
    const whereClause: any = {
      organizationId: req.user!.organizationId,
      deletedAt: null
    };

    if (tag) whereClause.assetTag = { contains: tag as string, mode: 'insensitive' };
    if (serialNumber) whereClause.serialNumber = { contains: serialNumber as string, mode: 'insensitive' };
    if (categoryId) whereClause.categoryId = categoryId as string;
    if (status) whereClause.status = status as AssetStatus;
    if (departmentId) whereClause.departmentId = departmentId as string;
    if (locationId) whereClause.locationId = locationId as string;

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { assetTag: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: true,
        department: true,
        location: true,
        activeAllocation: {
          include: {
            allocation: {
              include: {
                allocatedTo: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        }
      }
    });

    res.json(assets);
  } catch (error) {
    next(error);
  }
});

// Get asset historical timeline (All users, results scoped to org)
router.get('/:id/history', async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify asset exists
    const asset = await prisma.asset.findFirst({
      where: { id, organizationId, deletedAt: null }
    });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 1. Fetch AssetHistory
    const history = await prisma.assetHistory.findMany({
      where: { assetId: id, organizationId },
      include: { actor: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Allocations
    const allocations = await prisma.assetAllocation.findMany({
      where: { assetId: id, organizationId },
      include: {
        allocatedTo: { select: { id: true, firstName: true, lastName: true } },
        allocatedBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch Maintenance Requests
    const maintenance = await prisma.maintenanceRequest.findMany({
      where: { assetId: id, organizationId },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTechnician: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Consolidate into a single chronological list
    const timeline: any[] = [];

    history.forEach(h => {
      timeline.push({
        type: 'history',
        action: h.action,
        date: h.createdAt,
        actor: h.actor,
        reason: h.reason,
        metadata: h.metadata
      });
    });

    allocations.forEach(a => {
      timeline.push({
        type: 'allocation',
        action: a.status === 'ACTIVE' ? 'ALLOCATED' : 'RETURNED',
        date: a.allocatedAt,
        actor: a.allocatedBy,
        targetUser: a.allocatedTo,
        returnedAt: a.returnedAt,
        notes: a.status === 'ACTIVE' ? a.issueNotes : a.returnNotes
      });
    });

    maintenance.forEach(m => {
      timeline.push({
        type: 'maintenance',
        action: m.status,
        date: m.createdAt,
        actor: m.requestedBy,
        technician: m.assignedTechnician,
        issue: m.issue,
        resolvedAt: m.resolvedAt,
        cost: m.cost
      });
    });

    // Sort by date descending (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

export default router;
