import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;

    const [locations, departments, categories] = await Promise.all([
      prisma.location.findMany({ where: { organizationId: orgId } }),
      prisma.department.findMany({ where: { organizationId: orgId } }),
      prisma.assetCategory.findMany({ where: { organizationId: orgId } }),
    ]);

    res.json({ locations, departments, categories });
  } catch (error) {
    next(error);
  }
});

export default router;
