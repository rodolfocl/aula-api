import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getByInstance(instanceId) {
  try {
    return await repository.findByInstance(instanceId);
  } catch (err) {
    logger.error({ err, instanceId }, 'getByInstance — error al buscar sesiones');
    throw err;
  }
}

export async function create(data) {
  try {
    return await repository.create(data);
  } catch (err) {
    logger.error({ err }, 'create — error al crear sesión');
    throw err;
  }
}

export async function update(id, data) {
  try {
    const session = await repository.findById(id);
    if (!session) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    return await repository.update(id, data);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar sesión');
    throw err;
  }
}
