import { getUserRoles } from '../utils/courseAuth.js';

export async function requireAdmin(req, res, next) {
  try {
    const roles = await getUserRoles(req.user.sub);
    if (!roles.includes('administrador') && !roles.includes('profesor')) {
      return res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
