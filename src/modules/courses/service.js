import * as repository from './repository.js';

export async function getAll() {
  return repository.findAll();
}

export async function getById(id) {
  const course = await repository.findById(id);
  if (!course) {
    const err = new Error('Ramo no encontrado');
    err.status = 404;
    throw err;
  }
  return course;
}

export async function create(data) {
  return repository.create(data);
}

export async function update(id, data) {
  await getById(id);
  return repository.update(id, data);
}

export async function remove(id) {
  await getById(id);
  return repository.softDelete(id);
}