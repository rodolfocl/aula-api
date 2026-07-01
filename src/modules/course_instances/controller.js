import * as service from './service.js';

export async function getAll(req, res, next) {
  try { res.json(await service.getAll(req.query.year)); } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try { res.json(await service.getById(req.params.id)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try { res.status(201).json(await service.create(req.body)); } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try { res.json(await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}