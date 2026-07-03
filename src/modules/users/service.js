import logger from '../../config/logger.js';
import * as repository from './repository.js';

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

export async function remove(id) {
  try {
    return await repository.remove(id);
  } catch (err) {
    logger.error({ err, id }, 'remove — error al eliminar usuario');
    throw err;
  }
}
