import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.use(authMiddleware);

router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/grades', controller.getGrades);
router.post('/:id/grades', controller.saveGrades);

export default router;