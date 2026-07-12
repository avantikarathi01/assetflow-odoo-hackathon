import { Router } from 'express';
import { AuthService } from '../modules/auth/services';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await AuthService.registerOrganization(req.body);
    res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      data: result
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/users/:userId/promote', requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const result = await AuthService.promoteEmployee(
      req.user!.organizationId,
      userId as string,
      role
    );
    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
