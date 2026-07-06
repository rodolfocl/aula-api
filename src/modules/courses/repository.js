import db from '../../db/db.js';

export async function findAll({ year, teacherId, status, courseId } = {}) {
  const query = db('courses as ci')
    .join('course_templates as c', 'ci.template_id', 'c.id')
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
  if (courseId)  query.where('ci.template_id', courseId);
  return query;
}

export async function findById(id) {
  return db('courses as ci')
    .join('course_templates as c', 'ci.template_id', 'c.id')
    .join('users as u', 'ci.teacher_id', 'u.id')
    .select('ci.*', 'c.name as course_name', 'u.full_name as teacher_name')
    .where('ci.id', id)
    .first();
}

export async function create(data) {
  const [instance] = await db('courses').insert(data).returning('*');
  return instance;
}

export async function update(id, data) {
  const [instance] = await db('courses').where({ id }).update(data).returning('*');
  return instance;
}