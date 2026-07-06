import db from '../../db/db.js';

export async function findAll({ includeInactive = false } = {}) {
  const query = db('courses as c')
    .select(
      'c.*',
      db.raw(
        `(SELECT COUNT(*)::int FROM course_instances ci
          WHERE ci.course_id = c.id AND ci.status = 'active')
         AS active_instances_count`
      ),
      db.raw(
        `(SELECT COUNT(*)::int FROM course_instances ci
          WHERE ci.course_id = c.id AND ci.status <> 'active')
         AS past_instances_count`
      )
    )
    .orderBy('c.name');
  if (!includeInactive) query.where({ 'c.active': true });
  return query;
}

export async function findById(id) {
  return db('courses').where({ id }).first();
}

export async function create(data) {
  const [course] = await db('courses').insert(data).returning('*');
  return course;
}

export async function update(id, data) {
  const [course] = await db('courses').where({ id }).update(data).returning('*');
  return course;
}

export async function softDelete(id) {
  const [course] = await db('courses').where({ id }).update({ active: false }).returning('*');
  return course;
}