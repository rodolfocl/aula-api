import * as service from './service.js';
import {
  assertOwnerOrAdmin,
  getCourseInstanceIdFromSession,
} from '../../utils/courseAuth.js';

export async function getByInstance(req, res, next) {
  try {
    const sessions = await service.getByInstance(req.params.instanceId);
    res.locals.logSummary = `${sessions.length} sesiones`;
    res.json(sessions);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const courseInstanceId = req.body.course_id ?? req.body.offering_id;
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    res.locals.logSummary = `instance:${req.body.offering_id ?? req.body.course_id} fecha:${req.body.scheduled_at}`;
    res.status(201).json(await service.create(req.body));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromSession(req.params.id);
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    const session = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
    res.json(session);
  } catch (err) { next(err); }
}
