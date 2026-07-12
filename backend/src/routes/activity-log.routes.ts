import { Router } from 'express';
import { prisma } from '../lib/db/prisma';
import { requireManager } from '../middleware/auth';

const router = Router();

router.get('/', requireManager, async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { userId, actionType, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      organizationId
    };

    if (userId) whereClause.actorId = userId as string;
    if (actionType) whereClause.action = actionType as any;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.activityLog.count({ where: whereClause })
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
