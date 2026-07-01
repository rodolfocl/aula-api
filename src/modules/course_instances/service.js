import * as repository from './repository.js';

export async function getAll(year) {
  return repository.findAll(year);
}

export async function getById(id) {
  const instance = await repository.findById(id);
  if (!instance) {
    const err = new Error('Instancia no encontrada');
    err.status = 404;
    throw err;
  }
  return instance;
}

export async function create(data) {
  return repository.create(data);
}

export async function update(id, data) {
  await getById(id);
  return repository.update(id, data);
}