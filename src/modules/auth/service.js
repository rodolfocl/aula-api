import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as repository from './repository.js';
import { Resend } from 'resend';

export async function register({ full_name, email, password, phone, photo_url, roles }) {
  try {
    console.log('[AuthService] register — email:', email);
    const existing = await repository.findByEmail(email);
    if (existing) {
      console.log('[AuthService] register — email ya registrado:', email);
      const err = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }

    console.log('[AuthService] register — hasheando contraseña...');
    const password_hash = await bcrypt.hash(password, 10);

    console.log('[AuthService] register — creando usuario...');
    const user = await repository.create({ full_name, email, password_hash, phone, photo_url, roles });
    console.log('[AuthService] register — usuario creado, id:', user.id);
    return user;
  } catch (err) {
    console.error('[AuthService] register ERROR:', err);
    throw err;
  }
}

export async function login({ email, password }) {
  try {
    console.log('[AuthService] login — email:', email);
    const user = await repository.findByEmail(email);
    if (!user) {
      console.log('[AuthService] login — usuario no encontrado:', email);
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    console.log('[AuthService] login — verificando contraseña...');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log('[AuthService] login — contraseña incorrecta para:', email);
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    console.log('[AuthService] login — generando token JWT...');
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    console.log('[AuthService] login — login exitoso, userId:', user.id);
    return { token };
  } catch (err) {
    console.error('[AuthService] login ERROR:', err);
    throw err;
  }
}

export async function forgotPassword({ email }) {
  try {
    console.log('[AuthService] forgotPassword — buscando usuario:', email);
    const user = await repository.findByEmail(email);
    console.log('[AuthService] forgotPassword — usuario encontrado:', user ? 'sí' : 'no');

    if (user) {
      console.log('[AuthService] forgotPassword — generando token...');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      console.log('[AuthService] forgotPassword — guardando token en BD...');
      await repository.setResetToken(email, hashedToken, expiresAt);

      console.log('[AuthService] forgotPassword — enviando email con Resend...');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Recuperar contraseña — Aula PDV',
        html: `<p>Haz clic aquí para restablecer tu contraseña: <a href="${process.env.FRONTEND_URL}/reset-password?token=${rawToken}">Restablecer contraseña</a></p>`,
      });
      console.log('[AuthService] forgotPassword — Resend data:', JSON.stringify(data));
      console.log('[AuthService] forgotPassword — Resend error:', JSON.stringify(error));

      if (error) {
        throw new Error(`Resend error: ${JSON.stringify(error)}`);
      }
    }

    return { message: 'Si el email existe, recibirás un link de recuperación en tu bandeja.' };
  } catch (err) {
    console.error('[AuthService] forgotPassword ERROR:', err);
    throw err;
  }
}

export async function resetPassword({ token, new_password }) {
  try {
    console.log('[AuthService] resetPassword — validando token...');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await repository.findByResetToken(hashedToken);

    if (!user) {
      console.log('[AuthService] resetPassword — token inválido o expirado');
      const err = new Error('Token inválido o expirado');
      err.status = 400;
      throw err;
    }

    console.log('[AuthService] resetPassword — token válido, userId:', user.id);
    console.log('[AuthService] resetPassword — hasheando nueva contraseña...');
    const password_hash = await bcrypt.hash(new_password, 10);

    console.log('[AuthService] resetPassword — actualizando contraseña y limpiando token...');
    await repository.clearResetToken(user.id, password_hash);

    console.log('[AuthService] resetPassword — contraseña actualizada, userId:', user.id);
    return { message: 'Contraseña actualizada correctamente.' };
  } catch (err) {
    console.error('[AuthService] resetPassword ERROR:', err);
    throw err;
  }
}