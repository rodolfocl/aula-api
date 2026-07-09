import db from '../../db/db.js';

export async function findByInstance(instanceId) {
  return db('sessions')
    .where({ course_id: instanceId })
    .select('*')
    .orderBy('scheduled_at');
}

export async function findById(id) {
  return db('sessions').where({ id }).first();
}

export async function create(data) {
  const [session] = await db('sessions').insert(data).returning('*');
  return session;
}

export async function update(id, data) {
  const [session] = await db('sessions').where({ id }).update(data).returning('*');
  return session;
}

export async function deleteById(id) {
  return db('sessions').where({ id }).delete();
}

// IDs de sesiones del curso que ya tienen al menos un registro de asistencia con status
export async function findProtectedIds(courseId) {
  const rows = await db('sessions as s')
    .join('attendance as a', 'a.session_id', 's.id')
    .where('s.course_id', courseId)
    .whereNotNull('a.status')
    .distinct('s.id')
    .select('s.id');
  return rows.map(r => r.id);
}