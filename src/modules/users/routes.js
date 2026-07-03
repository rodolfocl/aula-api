import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const router = Router();

router.patch('/me/avatar', authMiddleware, controller.updateAvatar);
router.delete('/me/avatar', authMiddleware, controller.clearAvatar);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
