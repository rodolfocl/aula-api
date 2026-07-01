import * as repository from './repository.js';

export async function getByInstance(instanceId) {
  return repository.findByInstance(instanceId);
}

export async function create(data) {
  return repository.create(data);
}

export async function update(id, data) {
  const session = await repository.findById(id);
  if (!session) {
    const err = new Error('Sesión no encontrada');
    err.status = 404;
    throw err;
  }
  return repository.update(id, data);
}