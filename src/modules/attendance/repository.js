import db from '../../db/db.js';

export async function findByEnrollment(enrollmentId) {
  return db('attendance as a')
    .join('sessions as s', 'a.session_id', 's.id')
    .where('a.enrollment_id', enrollmentId)
    .select('a.*', 's.scheduled_at', 's.title')
    .orderBy('s.scheduled_at');
}

export async function findById(id) {
  return db('attendance').where({ id }).first();
}

export async function create(data) {
  const [record] = await db('attendance').insert(data).returning('*');
  return record;
}

export async function update(id, data) {
  const [record] = await db('attendance').where({ id }).update(data).returning('*');
  return record;
}