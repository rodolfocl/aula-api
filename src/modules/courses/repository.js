import db from '../../db/db.js';

export async function findAll({ includeInactive = false } = {}) {
  const query = db('courses').select('*').orderBy('name');
  if (!includeInactive) query.where({ active: true });
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