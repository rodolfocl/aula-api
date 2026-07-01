import * as repository from './repository.js';

export async function getByEnrollment(enrollmentId) {
  const records = await repository.findByEnrollment(enrollmentId);
  const absences = records.filter(r => r.status === 'absent').length;
  return { records, absences };
}

export async function create(data) {
  return repository.create(data);
}

export async function update(id, data) {
  const record = await repository.findById(id);
  if (!record) {
    const err = new Error('Registro de asistencia no encontrado');
    err.status = 404;
    throw err;
  }
  return repository.update(id, data);
}