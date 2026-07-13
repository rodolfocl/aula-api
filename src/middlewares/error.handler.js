export function errorHandler(err, req, res, next) {
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo supera el tamaño máximo permitido.' });
  }
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  if (status >= 500) res.locals.logErr = err;
  res.status(status).json({ error: message });
}
