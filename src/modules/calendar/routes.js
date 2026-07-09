import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/events', controller.getEvents);

export default router;