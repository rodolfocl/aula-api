import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getAll({ includeInactive = false } = {}) {
  try {
    return await repository.findAll({ includeInactive });
  } catch (err) {
    logger.error({ err, includeInactive }, 'getAll — error al buscar ramos');
    throw err;
  }
}

export async function getById(id) {
  try {
    const course = await repository.findById(id);
    if (!course) {
      const err = new Error('Ramo no encontrado');
      err.status = 404;
      throw err;
    }
    return course;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'getById — error inesperado');
    throw err;
  }
}

export async function create(data) {
  try {
    return await repository.create(data);
  } catch (err) {
    logger.error({ err }, 'create — error al crear ramo');
    throw err;
  }
}

export async function update(id, data) {
  try {
    await getById(id);
    return await repository.update(id, data);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar ramo');
    throw err;
  }
}

export async function remove(id) {
  try {
    await getById(id);
    return await repository.softDelete(id);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'remove — error al desactivar ramo');
    throw err;
  }
}
