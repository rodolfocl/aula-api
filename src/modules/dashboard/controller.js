import * as service from './service.js';

export async function getSummary(req, res, next) {
  try {
    const teacherId = req.query.teacher_id ?? null;
    const data = await service.getSummary({ teacherId });
    res.locals.logSummary = `clases hoy: ${data.clasesHoy.length}`;
    res.json(data);
  } catch (err) { next(err); }
}

export async function getAlerts(req, res, next) {
  try {
    const data = await service.getAlerts();
    res.locals.logSummary = `asistencia baja: ${data.cursosAsistenciaBaja.length}, riesgo: ${data.alumnosEnRiesgo.length}`;
    res.json(data);
  } catch (err) { next(err); }
}