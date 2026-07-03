import * as service from './service.js';

export async function getAll(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const courses = await service.getAll({ includeInactive });
    res.locals.logSummary = `${courses.length} ramos`;
    res.json(courses);
  } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try { res.json(await service.getById(req.params.id)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const course = await service.create(req.body);
    res.locals.logSummary = `creado: ${req.body.name}`;
    res.status(201).json(course);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const course = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
    res.json(course);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try { res.json(await service.remove(req.params.id)); } catch (err) { next(err); }
}
