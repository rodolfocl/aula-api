import * as repository from './repository.js';

export async function getAll() {
  return repository.findAll();
}

export async function getById(id) {
  const user = await repository.findById(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
}

export async function create(data) {
  return repository.create(data);
}

export async function update(id, data) {
  return repository.update(id, data);
}

export async function remove(id) {
  return repository.remove(id);
}