import logger from '../../config/logger.js';
import * as repository from './repository.js';
import * as sessionsRepo from '../sessions/repository.js';
import db from '../../db/db.js';
import { createMeetEvent, updateMeetEvent } from '../../utils/googleCalendarService.js';
import { createFolder } from '../../utils/googleDriveService.js';

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

const SCHEDULE_FIELDS = new Set(['start_date', 'end_date', 'day_of_week']);
const MEET_FIELDS     = new Set(['start_date', 'end_date', 'day_of_week', 'schedule_time', 'teacher_id']);

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

async function syncSessions(instance) {
  const [existing, protectedIds] = await Promise.all([
    sessionsRepo.findByInstance(instance.id),
    sessionsRepo.findProtectedIds(instance.id),
  ]);

  const protectedSet   = new Set(protectedIds);
  const expectedDates  = calcularFechasEsperadas(instance);
  const expectedSet    = new Set(expectedDates);
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

async function getTeacherEmail(teacherId) {
  if (!teacherId) return null;
  const user = await db('users').where({ id: teacherId }).select('email').first();
  return user?.email ?? null;
}

function hasScheduleData(instance) {
  return !!(instance.day_of_week && instance.start_date && instance.end_date);
}

// Dispara la creación/actualización de Meet en background — nunca bloquea el flujo principal.
async function syncMeetEvent(instance) {
  try {
    const teacherEmail = await getTeacherEmail(instance.teacher_id);
    const summary      = instance.course_name
      ? `${instance.course_name} — ${instance.teacher_name ?? ''}`
      : 'Clase Aula PDV';

    let meetData;
    if (instance.google_event_id) {
      meetData = await updateMeetEvent({
        eventId:      instance.google_event_id,
        summary,
        day_of_week:  instance.day_of_week,
        start_date:   typeof instance.start_date === 'string'
          ? instance.start_date
          : instance.start_date?.toISOString().slice(0, 10),
        end_date:     typeof instance.end_date === 'string'
          ? instance.end_date
          : instance.end_date?.toISOString().slice(0, 10),
        schedule_time: instance.schedule_time,
        teacherEmail,
      });
    } else {
      meetData = await createMeetEvent({
        summary,
        day_of_week:  instance.day_of_week,
        start_date:   typeof instance.start_date === 'string'
          ? instance.start_date
          : instance.start_date?.toISOString().slice(0, 10),
        end_date:     typeof instance.end_date === 'string'
          ? instance.end_date
          : instance.end_date?.toISOString().slice(0, 10),
        schedule_time: instance.schedule_time,
        teacherEmail,
      });
    }

    if (meetData) {
      await repository.update(instance.id, meetData);
      logger.info({ instanceId: instance.id, link: meetData.google_meet_link }, 'syncMeetEvent — Meet sincronizado');
    }
  } catch (err) {
    logger.error({ err, instanceId: instance.id }, 'syncMeetEvent — error (no bloqueante)');
  }
}

async function syncDriveFolder(instance) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
    const folderName = `${instance.course_name} [${instance.id}]`;
    const folder = await createFolder(folderName, rootFolderId);
    await repository.update(instance.id, { drive_folder_id: folder.id });
    logger.info({ instanceId: instance.id, folderId: folder.id }, 'syncDriveFolder — carpeta creada');
  } catch (err) {
    logger.error({ err, instanceId: instance.id }, 'syncDriveFolder — error al crear carpeta (no bloqueante)');
  }
}

export async function create(data) {
  try {
    const instance = await repository.create(sanitize(data));
    const full = await repository.findById(instance.id);

    if (hasScheduleData(instance)) {
      syncMeetEvent(full).catch(() => {});
    }

    syncDriveFolder(full).catch(() => {});

    return instance;
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

    const needsSync = Object.keys(sanitized).some(k => SCHEDULE_FIELDS.has(k));
    if (needsSync) {
      syncSessions(instance).catch(err =>
        logger.error({ err, id }, 'update — error al sincronizar sesiones')
      );
    }

    const meetChanged = Object.keys(sanitized).some(k => MEET_FIELDS.has(k));
    if (meetChanged && hasScheduleData(instance)) {
      const full = await repository.findById(instance.id);
      syncMeetEvent(full).catch(() => {});
    }

    return instance;
  } catch (err) {
    if (!err.status) logger.error({ err, id }, 'update — error al actualizar instancia');
    throw err;
  }
}