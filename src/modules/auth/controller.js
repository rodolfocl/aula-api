import * as service from './service.js';

export async function register(req, res, next) {
  try {
    const user = await service.register(req.body);
    res.locals.logSummary = `registrado: ${user.email}`;
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    res.locals.logSummary = req.body.email;
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    res.locals.logSummary = req.body.email;
    const result = await service.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await service.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;
    res.locals.logSummary = `usuario:${userId} newLen:${newPassword?.length ?? 0}`;
    const result = await service.changePassword({ userId, currentPassword, newPassword });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
