import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as controller from './controller.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authMiddleware);

router.get('/browse', controller.browse);
router.post('/folders', controller.createFolder);
router.post('/folders/:folderId/files', upload.single('file'), controller.uploadFile);
router.get('/files/:fileId/download', controller.downloadFile);
router.patch('/items/:itemId', controller.renameItem);
router.patch('/items/:itemId/move', controller.moveItem);
router.delete('/items/:itemId', controller.deleteItem);

export default router;
