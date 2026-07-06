import * as service from './service.js';

export async function getAll(req, res, next) {
  try {
    const { year, teacher_id: teacherId, status, course_id: courseId } = req.query;
    const instances = await service.getAll({ year, teacherId, status, courseId });
    res.locals.logSummary = `${instances.length} instancias`;
    res.json(instances);
  } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try { res.json(await service.getById(req.params.id)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    res.locals.logSummary = `course:${req.body.course_id} year:${req.body.year}`;
    res.status(201).json(await service.create(req.body));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const instance = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
    res.json(instance);
  } catch (err) { next(err); }
}
