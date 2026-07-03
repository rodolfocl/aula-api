import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getAll({ year, teacherId, status } = {}) {
  try {
    const instances = await repository.findAll({ year, teacherId, status });
    return instances;
  } catch (err) {
    logger.error({ err, year, teacherId, status }, 'getAll — error al buscar instancias');
    throw err;
  }
}

export async function getById(id) {
  try {
    const instance = await repository.findById(id);
    if (!instance) {
      const err = new Error('Instancia no encontrada');
      err.status = 404;
      throw err;
    }
    return instance;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'getById — error inesperado');
    throw err;
  }
}

export async function create(data) {
  try {
    const sanitized = { ...data };
    if (sanitized.start_date === '') sanitized.start_date = null;
    if (sanitized.end_date === '') sanitized.end_date = null;
    return await repository.create(sanitized);
  } catch (err) {
    logger.error({ err }, 'create — error al crear instancia');
    throw err;
  }
}

export async function update(id, data) {
  try {
    const sanitized = { ...data };
    if (sanitized.start_date === '') sanitized.start_date = null;
    if (sanitized.end_date === '') sanitized.end_date = null;
    await getById(id);
    return await repository.update(id, sanitized);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar instancia');
    throw err;
  }
}
