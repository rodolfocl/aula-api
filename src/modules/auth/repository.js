import db from '../../db/db.js';

export async function findByEmail(email) {
  return db('users').where({ email }).first();
}

export async function create(data) {
  const [user] = await db('users').insert(data).returning([
    'id', 'full_name', 'email', 'phone', 'photo_url', 'active', 'created_at',
  ]);
  return user;
}