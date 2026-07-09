import { Router } from 'express';
import * as controller from './controller.js';
import { googleCallback } from '../admin/controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.patch('/change-password', authMiddleware, controller.changePassword);
router.get('/google/callback', googleCallback);

export default router;