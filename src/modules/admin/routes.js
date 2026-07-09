import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/requireAdmin.js';
import * as controller from './controller.js';

const router = Router();
router.use(authMiddleware, requireAdmin);

router.get('/google/connect',      controller.googleConnect);
router.get('/google/status',       controller.googleStatus);
router.delete('/google/disconnect', controller.googleDisconnect);

export default router;
