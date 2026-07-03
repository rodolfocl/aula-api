import logger from '../../config/logger.js';
import * as repository from './repository.js';

const VALID_STATUSES = ['in_progress', 'approved', 'failed', 'withdrawn'];

export async function getByStudent(studentId) {
  try {
    return await repository.findByStudent(studentId);
  } catch (err) {
    logger.error({ err, studentId }, 'getByStudent — error al buscar inscripciones');
    throw err;
  }
}

export async function getByInstance(instanceId) {
  try {
    return await repository.findByInstance(instanceId);
  } catch (err) {
    logger.error({ err, instanceId }, 'getByInstance — error al buscar inscripciones');
    throw err;
  }
}

export async function create(data) {
  try {
    return await repository.create(data);
  } catch (err) {
    logger.error({ err }, 'create — error al crear inscripción');
    throw err;
  }
}

export async function updateStatus(id, status) {
  try {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`);
      err.status = 400;
      throw err;
    }

    const enrollment = await repository.findById(id);
    if (!enrollment) {
      const err = new Error('Inscripción no encontrada');
      err.status = 404;
      throw err;
    }

    return await repository.updateStatus(id, status);
  } catch (err) {
    if (!err.status) logger.error({ err, id, status }, 'updateStatus — error inesperado');
    throw err;
  }
}
