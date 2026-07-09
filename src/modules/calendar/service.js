import logger from '../../config/logger.js';
import * as repository from './repository.js';

const DAY_MAP = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };

// Paleta ampliada — colores distinguibles y con buen contraste entre sí
const PALETTE = [
  '#3B6CB7', // azul
  '#2E7D32', // verde
  '#7B3FA0', // violeta
  '#C0392B', // rojo
  '#0097A7', // teal
  '#E67E22', // naranja
  '#AD1457', // magenta
  '#00695C', // verde azulado
  '#1565C0', // azul oscuro
  '#558B2F', // verde claro
  '#4527A0', // índigo
  '#C9A96E', // dorado
];

// FNV-1a de 32 bits — mucho mejor distribución que suma simple de char codes
function colorForInstance(id) {
  let h = 0x811c9dc5;
  const s = String(id);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return PALETTE[h % PALETTE.length];
}

function occurrencesInRange(instance, rangeStart, rangeEnd) {
  const dayIndex = DAY_MAP[instance.day_of_week];
  if (dayIndex === undefined || !instance.start_date) return [];

  const from = new Date(Math.max(rangeStart.getTime(), new Date(instance.start_date).getTime()));
  const to   = instance.end_date
    ? new Date(Math.min(rangeEnd.getTime(), new Date(instance.end_date).getTime()))
    : new Date(rangeEnd.getTime());

  const dates = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor.getUTCDay() !== dayIndex) cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= to) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return dates;
}

export async function getCalendarEvents(start, end, teacherId) {
  try {
    const rangeStart = new Date(start + 'T00:00:00Z');
    const rangeEnd   = new Date(end   + 'T23:59:59Z');

    const instances = await repository.findActiveInstancesInRange(rangeStart, rangeEnd, teacherId);

    const events = [];
    for (const inst of instances) {
      const color    = colorForInstance(inst.course_instance_id);
      const timeStr  = inst.schedule_time?.slice(0, 5) ?? null;  // 'HH:MM'
      const title    = timeStr ? `${timeStr} ${inst.course_name}` : inst.course_name;

      for (const date of occurrencesInRange(inst, rangeStart, rangeEnd)) {
        events.push({
          id:    `${inst.course_instance_id}-${date}`,
          title,
          start: timeStr ? `${date}T${inst.schedule_time.slice(0, 8)}` : date,
          color,
          extendedProps: {
            courseName: inst.course_name,
            teacher:    inst.teacher_name,
            time:       timeStr,
            instanceId: inst.course_instance_id,
            students:   parseInt(inst.student_count ?? 0),
          },
        });
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start));
    return events;
  } catch (err) {
    logger.error({ err, start, end, teacherId }, 'getCalendarEvents — error');
    throw err;
  }
}