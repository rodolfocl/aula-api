import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as repository from './repository.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

export async function register({ full_name, email, password, phone, photo_url }) {
  const existing = await repository.findByEmail(email);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  return repository.create({ full_name, email, password_hash, phone, photo_url });
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

export async function forgotPassword({ email }) {
  const user = await repository.findByEmail(email);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await repository.setResetToken(email, hashedToken, expiresAt);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, user.full_name, resetLink);
  }

  return { message: 'Si el email existe, recibirás un link de recuperación en tu bandeja.' };
}

export async function resetPassword({ token, new_password }) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await repository.findByResetToken(hashedToken);

  if (!user) {
    const err = new Error('Token inválido o expirado');
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(new_password, 10);
  await repository.clearResetToken(user.id, password_hash);

  return { message: 'Contraseña actualizada correctamente.' };
}