import { Router } from 'express';
import { AssetService } from '../modules/assets/services/asset.service';
import { requireManager } from '../middleware/auth';

const router = Router();

router.post('/', requireManager, async (req, res, next) => {
  try {
    const data = req.body;
    const asset = await AssetService.registerAsset(req.user!.organizationId, {
      ...data,
      createdById: req.user!.userId
    });
    res.status(201).json(asset);
  } catch (error: any) {
    next(error);
  }
});

export default router;
