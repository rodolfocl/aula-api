import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Sliding session: renueva la ventana de 24h en cada request autenticada exitosa
    const renewed = jwt.sign(
      { sub: decoded.sub, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );
    res.setHeader('X-Renewed-Token', renewed);

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}