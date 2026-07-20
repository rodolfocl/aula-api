import db from '../../db/db.js';

// avatar excluido del listado general para no penalizar la consulta con blobs grandes
const LIST_FIELDS   = ['id', 'full_name', 'email', 'phone', 'active', 'roles', 'created_at'];
const DETAIL_FIELDS = [...LIST_FIELDS, 'avatar'];

export async function findAll({ includeInactive = false } = {}) {
  const query = db('users').select(LIST_FIELDS).orderBy('full_name', 'asc');
  if (!includeInactive) query.where({ active: true });
  return query;
}

export async function findById(id) {
  return db('users').select(DETAIL_FIELDS).where({ id }).first();
}

export async function findByEmail(email) {
  return db('users').select('id').where({ email }).first();
}

export async function update(id, data) {
  const [user] = await db('users').where({ id }).update(data).returning('*');
  return user;
}

export async function updateAvatar(id, avatar) {
  const [user] = await db('users')
    .where({ id })
    .update({ avatar, updated_at: new Date() })
    .returning(DETAIL_FIELDS);
  return user;
}

export async function clearAvatar(id) {
  const [user] = await db('users')
    .where({ id })
    .update({ avatar: null, updated_at: new Date() })
    .returning(DETAIL_FIELDS);
  return user;
}

export async function remove(id) {
  return db('users').where({ id }).delete();
}
