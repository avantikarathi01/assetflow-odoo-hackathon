import { Router } from 'express';
import { AuthService } from '../modules/auth/services';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await AuthService.registerOrganizationAndAdmin(req.body);
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
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
