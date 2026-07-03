import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getAttendanceTable(instanceId) {
  try {
    return await repository.findTableByInstance(instanceId);
  } catch (err) {
    logger.error({ err, instanceId }, 'getAttendanceTable — error al obtener tabla');
    throw err;
  }
}

export async function upsertBulk(registros) {
  try {
    return await repository.upsertBulk(registros);
  } catch (err) {
    logger.error({ err, count: registros?.length }, 'upsertBulk — error al guardar registros');
    throw err;
  }
}

export async function getByEnrollment(enrollmentId) {
  try {
    const records = await repository.findByEnrollment(enrollmentId);
    const absences = records.filter(r => r.status === 'absent').length;
    return { records, absences };
  } catch (err) {
    logger.error({ err, enrollmentId }, 'getByEnrollment — error al buscar registros');
    throw err;
  }
}

export async function create(data) {
  try {
    return await repository.create(data);
  } catch (err) {
    logger.error({ err }, 'create — error al registrar asistencia');
    throw err;
  }
}

export async function update(id, data) {
  try {
    const record = await repository.findById(id);
    if (!record) {
      const err = new Error('Registro de asistencia no encontrado');
      err.status = 404;
      throw err;
    }
    return await repository.update(id, data);
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar registro');
    throw err;
  }
}
