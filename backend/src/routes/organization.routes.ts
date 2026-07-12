import { Router } from 'express';
import { LocationService } from '../modules/organizations/location.service';
import { DepartmentService } from '../modules/organizations/department.service';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

router.get('/users', requireAuth, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { department: true, userRoles: { include: { role: true } } }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/locations', requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const location = await LocationService.createLocation(req.user!.organizationId, {
      name: data.name,
      code: data.code || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4),
      parentId: data.parentId
    });
    res.status(201).json(location);
  } catch (error: any) {
    next(error);
  }
});

router.post('/departments', requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const department = await DepartmentService.createDepartment(req.user!.organizationId, {
      name: data.name,
      code: data.code,
      parentId: data.parentId,
      headUserId: data.headUserId || data.managerId
    });
    res.status(201).json(department);
  } catch (error: any) {
    next(error);
  }
});

router.post('/categories', requireAdmin, async (req, res, next) => {
  try {
    const category = await prisma.assetCategory.create({
      data: {
        organizationId: req.user!.organizationId,
        name: req.body.name,
        code: req.body.code || req.body.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6),
        description: req.body.description
      }
    });
    res.status(201).json(category);
  } catch (error: any) {
    next(error);
  }
});

export default router;
