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
    const { offering_id, course_id, ...rest } = req.body;
    const courseInstanceId = course_id ?? offering_id;
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    res.locals.logSummary = `instance:${courseInstanceId} fecha:${rest.scheduled_at}`;
    res.status(201).json(await service.create({ ...rest, course_id: courseInstanceId }));
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

export async function remove(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromSession(req.params.id);
    if (courseInstanceId != null) await assertOwnerOrAdmin(req, courseInstanceId);
    await service.deleteById(req.params.id);
    res.locals.logSummary = `eliminó sesión: ${req.params.id}`;
    res.status(204).send();
  } catch (err) { next(err); }
}
