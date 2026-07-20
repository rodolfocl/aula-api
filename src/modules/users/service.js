import logger from '../../config/logger.js';
import * as repository from './repository.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getAll({ includeInactive = false } = {}) {
  try {
    return await repository.findAll({ includeInactive });
  } catch (err) {
    logger.error({ err, includeInactive }, 'getAll — error al buscar usuarios');
    throw err;
  }
}

export async function getById(id) {
  try {
    const user = await repository.findById(id);
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }
    return user;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'getById — error inesperado');
    throw err;
  }
}

export async function update(id, data) {
  try {
    return await repository.update(id, data);
  } catch (err) {
    logger.error({ err, id }, 'update — error al actualizar usuario');
    throw err;
  }
}

export async function updateMe(id, data) {
  try {
    const allowed = {};

    if ('full_name' in data) {
      const name = typeof data.full_name === 'string' ? data.full_name.trim() : '';
      if (!name) {
        const err = new Error('El nombre no puede estar vacío.');
        err.status = 400;
        throw err;
      }
      if (name.length > 100) {
        const err = new Error('El nombre no puede superar los 100 caracteres.');
        err.status = 400;
        throw err;
      }
      allowed.full_name = name;
    }

    if ('email' in data) {
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (!email) {
        const err = new Error('El correo no puede estar vacío.');
        err.status = 400;
        throw err;
      }
      if (!EMAIL_REGEX.test(email)) {
        const err = new Error('El correo no tiene un formato válido.');
        err.status = 400;
        throw err;
      }
      if (email.length > 150) {
        const err = new Error('El correo no puede superar los 150 caracteres.');
        err.status = 400;
        throw err;
      }
      const existing = await repository.findByEmail(email);
      if (existing && existing.id !== id) {
        const err = new Error('Este correo ya está registrado por otro usuario.');
        err.status = 409;
        throw err;
      }
      allowed.email = email;
    }

    if (!Object.keys(allowed).length) {
      const err = new Error('No hay campos válidos para actualizar.');
      err.status = 400;
      throw err;
    }

    const user = await repository.update(id, allowed);
    logger.info({ userId: id, fields: Object.keys(allowed) }, 'updateMe — perfil actualizado');
    return user;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'updateMe — error inesperado');
    throw err;
  }
}

export async function remove(id) {
  try {
    return await repository.remove(id);
  } catch (err) {
    logger.error({ err, id }, 'remove — error al eliminar usuario');
    throw err;
  }
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB del archivo original

export async function updateAvatar(userId, avatar) {
  try {
    // Validar formato: data:<mime>;base64,<datos>
    const match = avatar?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s);
    if (!match) {
      const err = new Error('Formato inválido. Solo se aceptan imágenes JPEG, PNG o WebP en base64.');
      err.status = 400;
      throw err;
    }

    const mimeType = match[1];
    if (!ALLOWED_MIME.has(mimeType)) {
      const err = new Error('Formato inválido. Solo se aceptan imágenes JPEG, PNG o WebP.');
      err.status = 400;
      throw err;
    }

    // Tamaño aproximado: base64 chars × 0.75 ≈ bytes originales
    const approxBytes = Math.ceil(match[2].length * 0.75);
    if (approxBytes > MAX_BYTES) {
      const err = new Error('La imagen supera el límite de 2 MB.');
      err.status = 413;
      throw err;
    }

    const user = await repository.updateAvatar(userId, avatar);
    logger.info({ userId }, 'updateAvatar — foto de perfil actualizada');
    return user;
  } catch (err) {
    if (!err.status) logger.error({ err, userId }, 'updateAvatar — error inesperado');
    throw err;
  }
}

export async function clearAvatar(userId) {
  try {
    await repository.clearAvatar(userId);
    logger.info({ userId }, 'clearAvatar — foto de perfil eliminada');
  } catch (err) {
    logger.error({ err, userId }, 'clearAvatar — error inesperado');
    throw err;
  }
}
