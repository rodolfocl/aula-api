import * as service from './service.js';

export async function initFolder(req, res, next) {
  try {
    const result = await service.initFolder(req.params.id, req.user.sub);
    res.locals.logSummary = result.created ? `carpeta creada: ${result.drive_folder_id}` : 'carpeta ya existente';
    res.json(result);
  } catch (err) { next(err); }
}

export async function listFiles(req, res, next) {
  try {
    const result = await service.listFiles(req.params.id, req.user.sub);
    res.locals.logSummary = `${result.files.length} archivos`;
    res.json(result);
  } catch (err) { next(err); }
}

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const file = await service.uploadFile(req.params.id, req.user.sub, req.file);
    res.locals.logSummary = `subido: ${file.name}`;
    res.status(201).json(file);
  } catch (err) { next(err); }
}

export async function downloadFile(req, res, next) {
  try {
    const { meta, stream } = await service.downloadFile(req.params.id, req.user.sub, req.params.fileId);
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`;
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    stream.pipe(res);
  } catch (err) { next(err); }
}

export async function deleteFile(req, res, next) {
  try {
    await service.deleteFile(req.params.id, req.user.sub, req.params.fileId);
    res.locals.logSummary = `eliminado: ${req.params.fileId}`;
    res.json({ message: 'Archivo eliminado' });
  } catch (err) { next(err); }
}