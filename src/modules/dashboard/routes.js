import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', controller.getSummary);
router.get('/alerts', controller.getAlerts);

export default router;