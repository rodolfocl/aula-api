import db from '../../db/db.js';

export async function findByInstance(instanceId) {
  return db('sessions')
    .where({ offering_id: instanceId })
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