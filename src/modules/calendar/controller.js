import * as service from './service.js';

export async function getEvents(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end || !/^\d{4}-\d{2}-\d{2}/.test(start) || !/^\d{4}-\d{2}-\d{2}/.test(end)) {
      return res.status(400).json({ error: 'Parámetros start y end requeridos (YYYY-MM-DD)' });
    }

    const roles     = req.user.roles ?? [];
    const teacherId = roles.includes('administrador') ? null : req.user.id;

    const data = await service.getCalendarEvents(start.slice(0, 10), end.slice(0, 10), teacherId);
    res.locals.logSummary = `${start.slice(0,10)}→${end.slice(0,10)}, eventos: ${data.length}`;
    res.json(data);
  } catch (err) { next(err); }
}