import { Router } from 'express';
import { ReportService } from '../modules/reports/services/report.service';
import { requireManager } from '../middleware/auth';

const router = Router();

router.get('/utilization', requireManager, async (req, res, next) => {
  try {
    const report = await ReportService.getUtilizationReport(req.user!.organizationId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/maintenance-frequency', requireManager, async (req, res, next) => {
  try {
    const report = await ReportService.getMaintenanceFrequencyReport(req.user!.organizationId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/department-summary', requireManager, async (req, res, next) => {
  try {
    const report = await ReportService.getDepartmentSummaryReport(req.user!.organizationId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/booking-heatmap', requireManager, async (req, res, next) => {
  try {
    const report = await ReportService.getBookingHeatmap(req.user!.organizationId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

export default router;
