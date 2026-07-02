import * as repository from './repository.js';

const VALID_STATUSES = ['in_progress', 'approved', 'failed', 'withdrawn'];

export async function getByStudent(studentId) {
  try {
    console.log('[EnrollmentsService] getByStudent — studentId:', studentId);
    const enrollments = await repository.findByStudent(studentId);
    console.log('[EnrollmentsService] getByStudent — inscripciones encontradas:', enrollments.length);
    return enrollments;
  } catch (err) {
    console.error('[EnrollmentsService] getByStudent ERROR:', err);
    throw err;
  }
}

export async function getByInstance(instanceId) {
  try {
    console.log('[EnrollmentsService] getByInstance — instanceId:', instanceId);
    const enrollments = await repository.findByInstance(instanceId);
    console.log('[EnrollmentsService] getByInstance — inscripciones encontradas:', enrollments.length);
    return enrollments;
  } catch (err) {
    console.error('[EnrollmentsService] getByInstance ERROR:', err);
    throw err;
  }
}

export async function create(data) {
  try {
    console.log('[EnrollmentsService] create — creando inscripción:', data);
    const enrollment = await repository.create(data);
    console.log('[EnrollmentsService] create — inscripción creada, id:', enrollment.id);
    return enrollment;
  } catch (err) {
    console.error('[EnrollmentsService] create ERROR:', err);
    throw err;
  }
}

export async function updateStatus(id, status) {
  try {
    console.log('[EnrollmentsService] updateStatus — id:', id, '| status:', status);

    if (!VALID_STATUSES.includes(status)) {
      console.log('[EnrollmentsService] updateStatus — estado inválido:', status);
      const err = new Error(`Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`);
      err.status = 400;
      throw err;
    }

    console.log('[EnrollmentsService] updateStatus — buscando inscripción...');
    const enrollment = await repository.findById(id);
    if (!enrollment) {
      console.log('[EnrollmentsService] updateStatus — inscripción no encontrada, id:', id);
      const err = new Error('Inscripción no encontrada');
      err.status = 404;
      throw err;
    }

    const result = await repository.updateStatus(id, status);
    console.log('[EnrollmentsService] updateStatus — status actualizado a:', status, '| id:', id);
    return result;
  } catch (err) {
    console.error('[EnrollmentsService] updateStatus ERROR:', err);
    throw err;
  }
}