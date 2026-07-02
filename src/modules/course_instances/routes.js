import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';
import * as evaluationsController from '../evaluations/controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);

router.get('/:id/evaluations', evaluationsController.getByCourseInstance);
router.post('/:id/evaluations', evaluationsController.create);
router.get('/:id/grades-table', evaluationsController.getGradesTable);

export default router;