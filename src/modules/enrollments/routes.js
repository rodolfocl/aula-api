import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/student/:studentId', controller.getByStudent);
router.get('/instance/:instanceId', controller.getByInstance);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);

export default router;