import logger from '../../config/logger.js';
import * as repository from './repository.js';
import * as sessionsRepo from '../sessions/repository.js';

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
const ALLOWED_FIELDS = ['template_id', 'teacher_id', 'year', 'period', 'start_date', 'end_date', 'max_absences', 'status', 'close_reason', 'is_historical', 'day_of_week', 'schedule_time'];

// Campos de planificación que disparan el recálculo de sesiones
const SCHEDULE_FIELDS = new Set(['start_date', 'end_date', 'day_of_week']);

const DAY_MAP = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };

function sanitize(data) {
  const s = Object.fromEntries(ALLOWED_FIELDS.filter(k => k in data).map(k => [k, data[k]]));
  if (s.start_date === '') s.start_date = null;
  if (s.end_date === '') s.end_date = null;
  if (s.schedule_time === '') s.schedule_time = null;
  if (s.day_of_week !== undefined) {
    s.day_of_week = DAYS_OF_WEEK.includes(s.day_of_week) ? s.day_of_week : null;
  }
  return s;
}

// Calcula todas las fechas esperadas (YYYY-MM-DD) dentro del rango del curso.
// Requiere start_date, end_date y day_of_week para poder calcular.
function calcularFechasEsperadas(instance) {
  const dayIndex = DAY_MAP[instance.day_of_week];
  if (dayIndex === undefined || !instance.start_date || !instance.end_date) return [];

  const from = new Date(instance.start_date);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(instance.end_date);
  to.setUTCHours(23, 59, 59, 999);

  const dates = [];
  const cursor = new Date(from);
  while (cursor.getUTCDay() !== dayIndex) cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= to) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return dates;
}

function toDateStr(scheduledAt) {
  if (scheduledAt instanceof Date) return scheduledAt.toISOString().slice(0, 10);
  return String(scheduledAt).slice(0, 10);
}

// Sincroniza sesiones del curso según el rango y día actuales.
// - Elimina sesiones sin asistencia que quedan fuera del rango.
// - Crea sesiones para fechas esperadas que aún no existen.
// - Nunca toca sesiones con registros de asistencia.
async function syncSessions(instance) {
  const [existing, protectedIds] = await Promise.all([
    sessionsRepo.findByInstance(instance.id),
    sessionsRepo.findProtectedIds(instance.id),
  ]);

  const protectedSet = new Set(protectedIds);
  const expectedDates = calcularFechasEsperadas(instance);
  const expectedSet   = new Set(expectedDates);

  const existingByDate = new Map(existing.map(s => [toDateStr(s.scheduled_at), s]));

  const toDelete = existing.filter(s =>
    !expectedSet.has(toDateStr(s.scheduled_at)) && !protectedSet.has(s.id)
  );
  const toAdd = expectedDates.filter(d => !existingByDate.has(d));

  await Promise.all([
    ...toDelete.map(s => sessionsRepo.deleteById(s.id)),
    ...toAdd.map(d => sessionsRepo.create({
      course_id:    instance.id,
      scheduled_at: new Date(d + 'T12:00:00Z'),
    })),
  ]);

  logger.info(
    { instanceId: instance.id, eliminadas: toDelete.length, agregadas: toAdd.length },
    'syncSessions — completado'
  );
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
    const sanitized = sanitize(data);
    const instance  = await repository.update(id, sanitized);

    // Si cambiaron fechas o día de la semana, sincronizar sesiones en background
    const needsSync = Object.keys(sanitized).some(k => SCHEDULE_FIELDS.has(k));
    if (needsSync) {
      syncSessions(instance).catch(err =>
        logger.error({ err, id }, 'update — error al sincronizar sesiones')
      );
    }

    return instance;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar instancia');
    throw err;
  }
}