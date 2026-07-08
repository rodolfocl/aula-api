import * as service from './service.js';

export async function getByStudent(req, res, next) {
  try {
    const enrollments = await service.getByStudent(req.params.studentId);
    res.locals.logSummary = `${enrollments.length} inscripciones`;
    res.json(enrollments);
  } catch (err) { next(err); }
}

export async function getByInstance(req, res, next) {
  try {
    const enrollments = await service.getByInstance(req.params.instanceId);
    res.locals.logSummary = `${enrollments.length} inscripciones`;
    res.json(enrollments);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    res.locals.logSummary = `student:${req.body.student_id} instance:${req.body.instance_id}`;
    res.status(201).json(await service.create(req.body));
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const result = await service.updateStatus(req.params.id, req.body.status);
    res.locals.logSummary = `status → ${req.body.status}`;
    res.json(result);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const result = await service.remove(req.params.id);
    res.locals.logSummary = `enrollment:${req.params.id} → withdrawn`;
    res.json(result);
  } catch (err) { next(err); }
}
