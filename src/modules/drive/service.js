import * as driveLib from '../../utils/googleDriveService.js';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

function resolveFolder(folderId) {
  if (!folderId || folderId === 'root') return ROOT_FOLDER_ID;
  return folderId;
}

export async function browse(folderId) {
  const resolvedId = resolveFolder(folderId);
  const [{ folders, files }, breadcrumb] = await Promise.all([
    driveLib.listChildren(resolvedId),
    driveLib.getItemPath(resolvedId, ROOT_FOLDER_ID),
  ]);
  return { currentFolderId: resolvedId, breadcrumb, folders, files };
}

export async function createFolder(parentId, name) {
  const resolvedParent = resolveFolder(parentId);
  return driveLib.createFolder(name, resolvedParent);
}

export async function uploadFile(folderId, file) {
  const resolvedId = resolveFolder(folderId);
  return driveLib.uploadFile(resolvedId, file.buffer, file.originalname, file.mimetype);
}

export async function downloadFile(fileId) {
  const meta = await driveLib.getFileMetadata(fileId);
  const driveRes = await driveLib.downloadFile(fileId);
  return { meta, stream: driveRes.data };
}

export async function renameItem(itemId, name) {
  return driveLib.renameItem(itemId, name);
}

export async function deleteItem(itemId) {
  return driveLib.trashItem(itemId);
}
