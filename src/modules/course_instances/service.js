import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getAll({ year, teacherId, status, courseId } = {}) {
  try {
    const instances = await repository.findAll({ year, teacherId, status, courseId });
    return instances;
  } catch (err) {
    logger.error({ err, year, teacherId, status, courseId }, 'getAll — error al buscar instancias');
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

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function sanitize(data) {
  const s = { ...data };
  if (s.start_date === '') s.start_date = null;
  if (s.end_date === '') s.end_date = null;
  if (s.day_of_week !== undefined) {
    s.day_of_week = DAYS_OF_WEEK.includes(s.day_of_week) ? s.day_of_week : null;
  }
  return s;
}

export async function create(data) {
  try {
    return await repository.create(sanitize(data));
  } catch (err) {
    logger.error({ err }, 'create — error al crear instancia');
    throw err;
  }
}

export async function update(id, data) {
  try {
    await getById(id);
    return await repository.update(id, sanitize(data));
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar instancia');
    throw err;
  }
}
