import db from '../../db/db.js';

const FIELDS = ['id', 'full_name', 'email', 'phone', 'photo_url', 'active', 'created_at'];

export async function findAll() {
  return db('users').select(FIELDS);
}

export async function findById(id) {
  return db('users').select(FIELDS).where({ id }).first();
}

export async function update(id, data) {
  const [user] = await db('users').where({ id }).update(data).returning('*');
  return user;
}

export async function remove(id) {
  return db('users').where({ id }).delete();
}