import * as service from './service.js';
import {
  assertOwnerOrAdmin,
  getCourseInstanceIdFromSession,
  getCourseInstanceIdFromAttendance,
} from '../../utils/courseAuth.js';

export async function getAttendanceTable(req, res, next) {
  try {
    const table = await service.getAttendanceTable(req.params.id);
    res.locals.logSummary = `${table.sesiones.length} sesiones, ${table.filas.length} alumnos`;
    res.json(table);
  } catch (err) { next(err); }
}

export async function upsertBulk(req, res, next) {
  try {
    const registros = req.body.registros ?? [];
    if (registros.length > 0) {
      const courseInstanceId = await getCourseInstanceIdFromSession(registros[0].session_id);
      if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    }
    const result = await service.upsertBulk(registros);
    res.locals.logSummary = `${registros.length} registros guardados`;
    res.json(result);
  } catch (err) { next(err); }
}

export async function getByEnrollment(req, res, next) {
  try {
    const result = await service.getByEnrollment(req.params.enrollmentId);
    res.locals.logSummary = `${result.records.length} registros, ${result.absences} ausencias`;
    res.json(result);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromSession(req.body.session_id);
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    const data = { ...req.body, recorded_by: req.user.sub };
    res.locals.logSummary = `enrollment:${req.body.enrollment_id} session:${req.body.session_id}`;
    res.status(201).json(await service.create(data));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromAttendance(req.params.id);
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    const result = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
    res.json(result);
  } catch (err) { next(err); }
}
