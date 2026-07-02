import * as service from './service.js';

export async function getAttendanceTable(req, res, next) {
  try { res.json(await service.getAttendanceTable(req.params.id)); } catch (err) { next(err); }
}

export async function upsertBulk(req, res, next) {
  try { res.json(await service.upsertBulk(req.body.registros ?? [])); } catch (err) { next(err); }
}

export async function getByEnrollment(req, res, next) {
  try { res.json(await service.getByEnrollment(req.params.enrollmentId)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const data = { ...req.body, recorded_by: req.user.sub };
    res.status(201).json(await service.create(data));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try { res.json(await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}