import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';
import * as evaluationsController from '../evaluations/controller.js';
import * as attendanceController from '../attendance/controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);

router.get('/:id/evaluations', evaluationsController.getByCourseInstance);
router.post('/:id/evaluations', evaluationsController.create);
router.get('/:id/grades-table', evaluationsController.getGradesTable);

router.get('/:id/attendance-table', attendanceController.getAttendanceTable);

export default router;