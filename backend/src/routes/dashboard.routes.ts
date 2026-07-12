import { Router } from 'express';
import { DashboardService } from '../modules/reports/services/dashboard.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const kpis = await DashboardService.getKPIs(req.user!.organizationId);
    res.status(200).json(kpis);
  } catch (error: any) {
    next(error);
  }
});

export default router;
