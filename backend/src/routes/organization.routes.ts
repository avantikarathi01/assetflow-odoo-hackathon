import { Router } from 'express';
import { LocationService } from '../modules/organizations/location.service';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/locations', requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const location = await LocationService.createLocation(req.user!.organizationId, {
      name: data.name,
      type: data.type || 'OFFICE',
      address: data.address
    });
    res.status(201).json(location);
  } catch (error: any) {
    next(error);
  }
});

router.post('/departments', requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const department = await LocationService.createDepartment(req.user!.organizationId, {
      name: data.name,
      code: data.code,
      locationId: data.locationId,
      managerId: data.managerId
    });
    res.status(201).json(department);
  } catch (error: any) {
    next(error);
  }
});

export default router;
