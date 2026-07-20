import { Router } from 'express';
import * as controller from './controller.js';

const router = Router({ mergeParams: true });

router.post('/:enrollmentId', controller.generate);
router.get('/:enrollmentId',  controller.get);

export default router;
