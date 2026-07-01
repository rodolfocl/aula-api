import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as repository from './repository.js';

export async function register({ full_name, email, password }) {
  const existing = await repository.findByEmail(email);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  return repository.create({ full_name, email, password_hash });
}

export async function login({ email, password }) {
  const user = await repository.findByEmail(email);
  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { token };
}