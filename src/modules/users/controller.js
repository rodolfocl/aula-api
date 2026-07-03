import * as service from './service.js';

export async function getAll(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const users = await service.getAll({ includeInactive });
    res.locals.logSummary = `${users.length} usuarios`;
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const user = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
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

export async function updateAvatar(req, res, next) {
  try {
    const userId = req.user.sub;
    const user = await service.updateAvatar(userId, req.body.avatar);
    res.locals.logSummary = `usuario:${userId} actualizó foto de perfil`;
    res.json({ avatar: user.avatar });
  } catch (err) {
    next(err);
  }
}

export async function clearAvatar(req, res, next) {
  try {
    const userId = req.user.sub;
    await service.clearAvatar(userId);
    res.locals.logSummary = `usuario:${userId} eliminó foto de perfil`;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
