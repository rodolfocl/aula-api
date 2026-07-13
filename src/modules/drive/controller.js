import * as service from './service.js';

export async function browse(req, res, next) {
  try {
    const { folderId } = req.query;
    const result = await service.browse(folderId ?? null);
    res.locals.logSummary = `${result.folders.length} carpetas, ${result.files.length} archivos`;
    res.json(result);
  } catch (err) { next(err); }
}

export async function createFolder(req, res, next) {
  try {
    const { parentId, name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const folder = await service.createFolder(parentId ?? null, name.trim());
    res.locals.logSummary = `carpeta creada: ${folder.name}`;
    res.status(201).json(folder);
  } catch (err) { next(err); }
}

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const { folderId } = req.params;
    const file = await service.uploadFile(folderId, req.file);
    res.locals.logSummary = `subido: ${file.name}`;
    res.status(201).json(file);
  } catch (err) { next(err); }
}

export async function downloadFile(req, res, next) {
  try {
    const { meta, stream } = await service.downloadFile(req.params.fileId);
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`;
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    stream.pipe(res);
  } catch (err) { next(err); }
}

export async function renameItem(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const item = await service.renameItem(req.params.itemId, name.trim());
    res.locals.logSummary = `renombrado: ${item.name}`;
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteItem(req, res, next) {
  try {
    await service.deleteItem(req.params.itemId);
    res.locals.logSummary = `eliminado: ${req.params.itemId}`;
    res.json({ message: 'Elemento eliminado' });
  } catch (err) { next(err); }
}
