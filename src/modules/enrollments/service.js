import * as repository from './repository.js';

const VALID_STATUSES = ['in_progress', 'approved', 'failed', 'withdrawn'];

export async function getByStudent(studentId) {
  return repository.findByStudent(studentId);
}

export async function create(data) {
  return repository.create(data);
}

export async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const enrollment = await repository.findById(id);
  if (!enrollment) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    throw err;
  }

  return repository.updateStatus(id, status);
}