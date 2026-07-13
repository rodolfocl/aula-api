import { google } from 'googleapis';
import { Readable } from 'stream';
import { getAuthorizedClient } from './googleCalendarService.js';
import logger from '../config/logger.js';

async function getDriveClient() {
  const auth = await getAuthorizedClient();
  if (!auth) {
    const err = new Error('Google Drive no está conectado. Conecta la cuenta desde el panel de administración.');
    err.status = 503;
    throw err;
  }
  return google.drive({ version: 'v3', auth });
}

export async function createFolder(name, parentId) {
  const drive = await getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id, name',
  });
  return res.data;
}

export async function listFiles(folderId) {
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    orderBy: 'name',
    pageSize: 200,
  });
  return res.data.files ?? [];
}

export async function uploadFile(folderId, fileBuffer, fileName, mimeType) {
  const drive = await getDriveClient();
  const stream = Readable.from(fileBuffer);
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
  });
  return res.data;
}

export async function getFileMetadata(fileId) {
  const drive = await getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
  });
  return res.data;
}

export async function downloadFile(fileId) {
  const drive = await getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return res;
}

export async function deleteFile(fileId) {
  const drive = await getDriveClient();
  await drive.files.delete({ fileId });
}

export async function listChildren(folderId) {
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink, starred)',
    orderBy: 'folder,name',
    pageSize: 500,
  });
  const all = res.data.files ?? [];
  const folders = all.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
  const files   = all.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
  return { folders, files };
}

export async function toggleStar(itemId, starred) {
  const drive = await getDriveClient();
  const res = await drive.files.update({
    fileId: itemId,
    requestBody: { starred },
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink, starred',
  });
  return res.data;
}

export async function renameItem(itemId, newName) {
  const drive = await getDriveClient();
  const res = await drive.files.update({
    fileId: itemId,
    requestBody: { name: newName },
    fields: 'id, name',
  });
  return res.data;
}

export async function trashItem(itemId) {
  const drive = await getDriveClient();
  await drive.files.update({
    fileId: itemId,
    requestBody: { trashed: true },
  });
}

export async function getItemInfo(itemId) {
  const drive = await getDriveClient();
  const res = await drive.files.get({
    fileId: itemId,
    fields: 'id, name, mimeType, parents',
  });
  return res.data;
}

export async function moveItem(itemId, newParentId, oldParentId) {
  const drive = await getDriveClient();
  const res = await drive.files.update({
    fileId: itemId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink, parents',
  });
  return res.data;
}

// Devuelve true si ancestorId es un ancestro de targetId (targetId está dentro de ancestorId)
export async function isFolderAncestorOf(ancestorId, targetId) {
  const drive = await getDriveClient();
  let currentId = targetId;
  const visited = new Set();
  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    if (currentId === ancestorId) return true;
    try {
      const res = await drive.files.get({ fileId: currentId, fields: 'parents' });
      currentId = res.data.parents?.[0] ?? null;
    } catch { break; }
  }
  return false;
}

// Recorre parents hacia arriba hasta rootFolderId y devuelve el breadcrumb [{id, name}].
export async function getItemPath(itemId, rootFolderId) {
  if (!itemId || itemId === rootFolderId) return [];
  const drive = await getDriveClient();
  const path = [];
  let currentId = itemId;

  while (currentId && currentId !== rootFolderId) {
    const res = await drive.files.get({
      fileId: currentId,
      fields: 'id, name, parents',
    });
    const item = res.data;
    path.unshift({ id: item.id, name: item.name });
    currentId = item.parents?.[0] ?? null;
  }

  return path;
}
