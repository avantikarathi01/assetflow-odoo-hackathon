import { Router } from 'express';
import { DashboardService } from '../modules/reports/services/dashboard.service';
import { prisma } from '../lib/db/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [kpis, upcomingEvents] = await Promise.all([
      DashboardService.getKPIs(req.user!.organizationId),
      DashboardService.getUpcomingEvents(req.user!.organizationId),
    ]);
    const logs = await prisma.activityLog.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { actor: true }
    });

    const recentActivity = await Promise.all(logs.map(async log => {
      let entityName = `${log.entityType} ${log.entityId.slice(-6)}`;
      try {
        if (log.entityType === 'ASSET' || log.entityType === 'Asset') {
          const asset = await prisma.asset.findUnique({ where: { id: log.entityId } });
          if (asset) entityName = asset.name;
        } else if (log.entityType === 'TransferRequest') {
           const t = await prisma.transferRequest.findUnique({ where: { id: log.entityId }, include: { asset: true } });
           if (t?.asset) entityName = `Transfer: ${t.asset.name}`;
           else entityName = `Transfer Request`;
        } else if (log.entityType === 'MaintenanceRecord') {
           const record = await prisma.maintenanceRecord.findUnique({ where: { id: log.entityId }, include: { asset: true } });
           if (record) entityName = `Maintenance: ${record.asset?.name || log.entityId.slice(-4)}`;
        }
      } catch (e) {}

      const diffMs = Date.now() - log.createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);
      let timeAgo = 'Just now';
      if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffHrs > 0) timeAgo = `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
      else if (diffMins > 0) timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

      return {
        id: log.id,
        action: log.action,
        entity: entityName,
        actor: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System',
        time: timeAgo,
        status: log.action
      };
    }));
    const myAssets = await prisma.assetAllocation.findMany({
      where: {
        organizationId: req.user!.organizationId,
        allocatedToUserId: req.user!.id,
        status: 'ACTIVE'
      },
      include: { asset: true }
    });

    res.status(200).json({ ...kpis, recentActivity, upcomingEvents, myAssets });
  } catch (error: any) {
    next(error);
  }
});

export default router;
