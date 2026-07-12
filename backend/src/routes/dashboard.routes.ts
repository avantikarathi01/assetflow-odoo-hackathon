import { Router } from 'express';
import { DashboardService } from '../modules/reports/services/dashboard.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const kpis = await DashboardService.getKPIs(req.user!.organizationId);
    // Since we don't have a fully populated activity feed in the DB yet,
    // we'll return some mock activity for demonstration in the dashboard
    const recentActivity = [
      { id: 1, action: "ALLOCATED",  entity: "Laptop Dell XPS 15",   actor: "John Doe",    time: "2 min ago",  status: "ALLOCATED" },
      { id: 2, action: "REQUESTED",  entity: "Transfer #TRF-004",     actor: "Sarah Kim",   time: "15 min ago", status: "REQUESTED" },
      { id: 3, action: "RESOLVED",   entity: "Maintenance #MNT-012",  actor: "Tech Team",   time: "1 hr ago",   status: "RESOLVED" },
    ];
    res.status(200).json({ ...kpis, recentActivity });
  } catch (error: any) {
    next(error);
  }
});

export default router;
