import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/enrollment/:enrollmentId', controller.getByEnrollment);
router.post('/bulk', controller.upsertBulk);
router.post('/', controller.create);
router.patch('/:id', controller.update);

export default router;