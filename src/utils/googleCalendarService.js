import { google } from 'googleapis';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import db from '../db/db.js';
import logger from '../config/logger.js';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY debe tener al menos 32 caracteres');
  return Buffer.from(key.slice(0, 32), 'utf8');
}

export function encrypt(text) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), encrypted.toString('hex'), tag.toString('hex')].join(':');
}

export function decrypt(payload) {
  const [ivHex, encHex, tagHex] = payload.split(':');
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
}

export function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl() {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

export async function exchangeCode(code) {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Devuelve un OAuth2Client listo con el refresh_token de BD (o null si no hay integración).
export async function getAuthorizedClient() {
  const row = await db('google_integration').orderBy('id', 'desc').first();
  if (!row) return null;
  const client = buildOAuthClient();
  client.setCredentials({ refresh_token: decrypt(row.refresh_token_encrypted) });
  return client;
}

function isInvalidGrant(err) {
  return err.message === 'invalid_grant' || err.response?.data?.error === 'invalid_grant';
}

// Detecta invalid_grant, borra el token de BD y lanza un error 401 claro.
export async function checkGoogleError(err) {
  if (isInvalidGrant(err)) {
    try { await db('google_integration').delete(); } catch (_) {}
    logger.warn('checkGoogleError — token inválido o revocado; integración eliminada de BD');
    const e = new Error(
      'La autorización de Google expiró o fue revocada. Reconectá la cuenta desde el panel de administración.',
    );
    e.status = 401;
    e.code = 'GOOGLE_INVALID_GRANT';
    throw e;
  }
}

const DAY_OF_WEEK_RRULE = {
  'Lunes':      'MO',
  'Martes':     'TU',
  'Miércoles':  'WE',
  'Jueves':     'TH',
  'Viernes':    'FR',
};

// start_date y end_date como strings 'YYYY-MM-DD', schedule_time como 'HH:MM' o 'HH:MM:SS'
function buildRRule(day_of_week, end_date) {
  const day = DAY_OF_WEEK_RRULE[day_of_week];
  if (!day) return null;
  // UNTIL en formato UTC: último segundo del día de end_date
  const until = end_date.replace(/-/g, '') + 'T235959Z';
  return `RRULE:FREQ=WEEKLY;BYDAY=${day};UNTIL=${until}`;
}

// Calcula la primera ocurrencia del día indicado a partir de start_date.
function firstOccurrence(day_of_week, start_date) {
  const dayIndex = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 }[day_of_week];
  const cursor = new Date(start_date + 'T00:00:00Z');
  while (cursor.getUTCDay() !== dayIndex) cursor.setUTCDate(cursor.getUTCDate() + 1);
  return cursor.toISOString().slice(0, 10);
}

// Construye las fechas de inicio y fin del primer evento (hora fija 20:00→21:30 Santiago/UTC-4)
function buildEventDateTimes(day_of_week, start_date, schedule_time) {
  const firstDate = firstOccurrence(day_of_week, start_date);
  const timeStart = schedule_time ? schedule_time.slice(0, 5) : '20:00';
  // Asume que el horario está en hora local de Chile (UTC-4 horario de invierno / UTC-3 verano).
  // Usamos el formato datetime local con timeZone para que Google interprete correctamente.
  const startDateTime = `${firstDate}T${timeStart}:00`;
  // Duración: 1h 30min (20:00 → 21:30)
  const [h, m] = timeStart.split(':').map(Number);
  const endMinutes = h * 60 + m + 90;
  const endHH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endMM = String(endMinutes % 60).padStart(2, '0');
  const endDateTime = `${firstDate}T${endHH}:${endMM}:00`;
  return { startDateTime, endDateTime };
}

export async function createMeetEvent({ summary, day_of_week, start_date, end_date, schedule_time, teacherEmail }) {
  const client = await getAuthorizedClient();
  if (!client) {
    logger.warn('createMeetEvent — integración de Google no conectada, se omite creación de Meet');
    return null;
  }

  const rrule = buildRRule(day_of_week, end_date);
  if (!rrule) {
    logger.warn({ day_of_week }, 'createMeetEvent — day_of_week no reconocido, se omite');
    return null;
  }

  const { startDateTime, endDateTime } = buildEventDateTimes(day_of_week, start_date, schedule_time);
  const requestId = `aula-pdv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const calendar = google.calendar({ version: 'v3', auth: client });
  const event = {
    summary,
    start: { dateTime: startDateTime, timeZone: 'America/Santiago' },
    end:   { dateTime: endDateTime,   timeZone: 'America/Santiago' },
    recurrence: [rrule],
    attendees: teacherEmail ? [{ email: teacherEmail }] : [],
    guestsCanJoinBeforeHostStarts: true,
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      resource: event,
    });
    return {
      google_event_id:  response.data.id,
      google_meet_link: response.data.hangoutLink ?? null,
    };
  } catch (err) {
    await checkGoogleError(err);
    throw err;
  }
}

export async function updateMeetEvent({ eventId, summary, day_of_week, start_date, end_date, schedule_time, teacherEmail }) {
  const client = await getAuthorizedClient();
  if (!client) return null;

  const calendar = google.calendar({ version: 'v3', auth: client });
  const patch = {};

  if (summary) patch.summary = summary;
  if (day_of_week && start_date && end_date) {
    const rrule = buildRRule(day_of_week, end_date);
    if (rrule) {
      const { startDateTime, endDateTime } = buildEventDateTimes(day_of_week, start_date, schedule_time);
      patch.recurrence = [rrule];
      patch.start = { dateTime: startDateTime, timeZone: 'America/Santiago' };
      patch.end   = { dateTime: endDateTime,   timeZone: 'America/Santiago' };
    }
  }
  if (teacherEmail !== undefined) {
    patch.attendees = teacherEmail ? [{ email: teacherEmail }] : [];
  }

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      resource: patch,
    });
    return {
      google_event_id:  response.data.id,
      google_meet_link: response.data.hangoutLink ?? null,
    };
  } catch (err) {
    await checkGoogleError(err);
    throw err;
  }
}
