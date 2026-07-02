import * as service from './service.js';

export async function getByCourseInstance(req, res, next) {
  try { res.json(await service.getByCourseInstance(req.params.id)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    res.status(201).json(await service.create(req.params.id, req.body));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try { res.json(await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function getGradesTable(req, res, next) {
  try { res.json(await service.getGradesTable(req.params.id)); } catch (err) { next(err); }
}

export async function getGrades(req, res, next) {
  try { res.json(await service.getGrades(req.params.id)); } catch (err) { next(err); }
}

export async function saveGrades(req, res, next) {
  try { res.json(await service.saveGrades(req.params.id, req.body.grades)); } catch (err) { next(err); }
}