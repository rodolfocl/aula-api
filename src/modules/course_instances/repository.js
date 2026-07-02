import db from '../../db/db.js';

export async function findAll({ year, teacherId, status } = {}) {
  const query = db('course_instances as ci')
    .join('courses as c', 'ci.course_id', 'c.id')
    .join('users as u', 'ci.teacher_id', 'u.id')
    .select(
      'ci.*',
      'c.name as course_name',
      'u.full_name as teacher_name',
    )
    .orderBy('ci.year', 'desc');

  if (year)      query.where('ci.year', year);
  if (teacherId) query.where('ci.teacher_id', teacherId);
  if (status)    query.where('ci.status', status);
  return query;
}

export async function findById(id) {
  return db('course_instances as ci')
    .join('courses as c', 'ci.course_id', 'c.id')
    .join('users as u', 'ci.teacher_id', 'u.id')
    .select('ci.*', 'c.name as course_name', 'u.full_name as teacher_name')
    .where('ci.id', id)
    .first();
}

export async function create(data) {
  const [instance] = await db('course_instances').insert(data).returning('*');
  return instance;
}

export async function update(id, data) {
  const [instance] = await db('course_instances').where({ id }).update(data).returning('*');
  return instance;
}