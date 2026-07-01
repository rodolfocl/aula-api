import db from '../../db/db.js';

export async function findByEmail(email) {
  return db('users').where({ email }).first();
}

export async function create(data) {
  const [user] = await db('users').insert(data).returning([
    'id', 'full_name', 'email', 'phone', 'photo_url', 'active', 'roles', 'created_at',
  ]);
  return user;
}

export async function setResetToken(email, hashedToken, expiresAt) {
  return db('users')
    .where({ email })
    .update({ reset_token: hashedToken, reset_token_expires_at: expiresAt, updated_at: new Date() });
}

export async function findByResetToken(hashedToken) {
  return db('users')
    .where('reset_token', hashedToken)
    .where('reset_token_expires_at', '>', new Date())
    .first();
}

export async function clearResetToken(id, passwordHash) {
  return db('users')
    .where({ id })
    .update({
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires_at: null,
      updated_at: new Date(),
    });
}