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
