import * as service from './service.js';

export async function getByStudent(req, res, next) {
  try { res.json(await service.getByStudent(req.params.studentId)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try { res.status(201).json(await service.create(req.body)); } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    res.json(await service.updateStatus(req.params.id, req.body.status));
  } catch (err) { next(err); }
}