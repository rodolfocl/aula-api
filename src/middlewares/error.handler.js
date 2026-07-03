export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  if (status >= 500) res.locals.logErr = err;
  res.status(status).json({ error: message });
}
