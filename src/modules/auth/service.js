import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../../config/logger.js';
import * as repository from './repository.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

export async function register({ full_name, email, password, phone, photo_url, roles }) {
  try {
    const existing = await repository.findByEmail(email);
    if (existing) {
      const err = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }

    const password_hash = await bcrypt.hash(password, 10);
    return await repository.create({ full_name, email, password_hash, phone, photo_url, roles });
  } catch (err) {
    if (!err.status) logger.error({ err, email }, 'register — error inesperado');
    throw err;
  }
}

export async function login({ email, password }) {
  try {
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
      { expiresIn: '8h' },
    );

    return { token };
  } catch (err) {
    if (!err.status) logger.error({ err, email }, 'login — error inesperado');
    throw err;
  }
}

export async function forgotPassword({ email }) {
  try {
    const user = await repository.findByEmail(email);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await repository.setResetToken(user.email, hashedToken, expiresAt);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, user.full_name, resetLink);
      } catch (emailErr) {
        logger.error({ emailErr, email: user.email }, 'forgotPassword — token guardado pero fallo al enviar email');
      }
    }

    return { message: 'Si el email existe, recibirás un link de recuperación en tu bandeja.' };
  } catch (err) {
    logger.error({ err, email }, 'forgotPassword — error inesperado');
    throw err;
  }
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  try {
    const user = await repository.findById(userId);
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    const currentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!currentValid) {
      const err = new Error('Contraseña actual incorrecta');
      err.status = 401;
      throw err;
    }

    if (newPassword.length < 3) {
      const err = new Error('La nueva contraseña debe tener al menos 3 caracteres');
      err.status = 422;
      throw err;
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsCurrent) {
      const err = new Error('La nueva contraseña no puede ser igual a la actual');
      err.status = 422;
      throw err;
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await repository.updatePassword(userId, password_hash);

    logger.info({ userId }, 'changePassword — contraseña actualizada');
    return { message: 'Contraseña actualizada correctamente.' };
  } catch (err) {
    if (!err.status) logger.error({ err, userId }, 'changePassword — error inesperado');
    throw err;
  }
}

export async function resetPassword({ token, new_password }) {
  try {
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
  } catch (err) {
    if (!err.status) logger.error({ err }, 'resetPassword — error inesperado');
    throw err;
  }
}
