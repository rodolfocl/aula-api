import * as service from './service.js';

export async function getAll(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const users = await service.getAll({ includeInactive });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await service.getById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const user = await service.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}