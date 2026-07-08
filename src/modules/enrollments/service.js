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
    const existing = await repository.findByStudentAndCourse(data.student_id, data.course_id);
    if (existing) {
      if (existing.status === 'withdrawn') {
        return await repository.updateStatus(existing.id, 'in_progress');
      }
      const err = new Error('El alumno ya está inscrito en este curso');
      err.status = 409;
      throw err;
    }
    return await repository.create(data);
  } catch (err) {
    if (!err.status) logger.error({ err }, 'create — error al crear inscripción');
    throw err;
  }
}

export async function remove(id) {
  try {
    const enrollment = await repository.findById(id);
    if (!enrollment) {
      const err = new Error('Inscripción no encontrada');
      err.status = 404;
      throw err;
    }
    return await repository.remove(id);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'remove — error inesperado');
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
