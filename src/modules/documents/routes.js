import { Router } from 'express';
import multer from 'multer';
import * as controller from './controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// mergeParams: true para acceder a :id del router padre (courses)
const router = Router({ mergeParams: true });

router.post('/folder', controller.initFolder);
router.get('/', controller.listFiles);
router.post('/', upload.single('file'), controller.uploadFile);
router.get('/:fileId/download', controller.downloadFile);
router.delete('/:fileId', controller.deleteFile);

export default router;