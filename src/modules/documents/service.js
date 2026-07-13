import db from '../../db/db.js';
import logger from '../../config/logger.js';
import { getUserRoles } from '../../utils/courseAuth.js';
import * as driveService from '../../utils/googleDriveService.js';

async function getCourseOrThrow(courseId) {
  const course = await db('courses as ci')
    .join('course_templates as c', 'ci.template_id', 'c.id')
    .select('ci.id', 'ci.drive_folder_id', 'ci.teacher_id', 'c.name as course_name')
    .where('ci.id', courseId)
    .first();
  if (!course) {
    const err = new Error('Clase no encontrada');
    err.status = 404;
    throw err;
  }
  return course;
}

export async function assertDocumentAccess(userId, courseId) {
  const roles = await getUserRoles(userId);
  if (roles.includes('administrador')) return;
  const instance = await db('courses').where({ id: courseId }).select('teacher_id').first();
  if (!instance || instance.teacher_id !== userId) {
    const err = new Error('No tienes acceso a los documentos de esta clase');
    err.status = 403;
    throw err;
  }
}

export async function initFolder(courseId, userId) {
  const course = await getCourseOrThrow(courseId);
  await assertDocumentAccess(userId, courseId);

  if (course.drive_folder_id) return { drive_folder_id: course.drive_folder_id, created: false };

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
  const folderName = `${course.course_name} [${courseId}]`;
  const folder = await driveService.createFolder(folderName, rootFolderId);

  await db('courses').where({ id: courseId }).update({ drive_folder_id: folder.id });
  logger.info({ courseId, folderId: folder.id }, 'documents — carpeta Drive creada manualmente');
  return { drive_folder_id: folder.id, created: true };
}

export async function listFiles(courseId, userId) {
  await assertDocumentAccess(userId, courseId);
  const course = await getCourseOrThrow(courseId);

  if (!course.drive_folder_id) {
    return { files: [], drive_folder_id: null };
  }

  const files = await driveService.listFiles(course.drive_folder_id);
  return { files, drive_folder_id: course.drive_folder_id };
}

export async function uploadFile(courseId, userId, file) {
  await assertDocumentAccess(userId, courseId);
  const course = await getCourseOrThrow(courseId);

  if (!course.drive_folder_id) {
    const err = new Error('Esta clase no tiene carpeta en Drive. Créala primero.');
    err.status = 422;
    throw err;
  }

  const uploaded = await driveService.uploadFile(
    course.drive_folder_id,
    file.buffer,
    file.originalname,
    file.mimetype,
  );
  return uploaded;
}

export async function downloadFile(courseId, userId, fileId) {
  await assertDocumentAccess(userId, courseId);
  const course = await getCourseOrThrow(courseId);
  if (!course.drive_folder_id) {
    const err = new Error('Esta clase no tiene carpeta en Drive');
    err.status = 422;
    throw err;
  }

  const meta = await driveService.getFileMetadata(fileId);
  const stream = await driveService.downloadFile(fileId);
  return { meta, stream };
}

export async function deleteFile(courseId, userId, fileId) {
  await assertDocumentAccess(userId, courseId);
  const course = await getCourseOrThrow(courseId);
  if (!course.drive_folder_id) {
    const err = new Error('Esta clase no tiene carpeta en Drive');
    err.status = 422;
    throw err;
  }
  await driveService.deleteFile(fileId);
}