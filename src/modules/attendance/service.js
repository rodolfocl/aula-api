import * as repository from './repository.js';

export async function getByEnrollment(enrollmentId) {
  try {
    console.log('[AttendanceService] getByEnrollment — enrollmentId:', enrollmentId);
    const records = await repository.findByEnrollment(enrollmentId);
    const absences = records.filter(r => r.status === 'absent').length;
    console.log('[AttendanceService] getByEnrollment — registros:', records.length, '| ausencias:', absences);
    return { records, absences };
  } catch (err) {
    console.error('[AttendanceService] getByEnrollment ERROR:', err);
    throw err;
  }
}

export async function create(data) {
  try {
    console.log('[AttendanceService] create — registrando asistencia:', data);
    const record = await repository.create(data);
    console.log('[AttendanceService] create — asistencia registrada, id:', record.id);
    return record;
  } catch (err) {
    console.error('[AttendanceService] create ERROR:', err);
    throw err;
  }
}

export async function update(id, data) {
  try {
    console.log('[AttendanceService] update — actualizando registro id:', id, '| campos:', Object.keys(data));
    const record = await repository.findById(id);
    if (!record) {
      console.log('[AttendanceService] update — registro no encontrado, id:', id);
      const err = new Error('Registro de asistencia no encontrado');
      err.status = 404;
      throw err;
    }
    const result = await repository.update(id, data);
    console.log('[AttendanceService] update — registro actualizado, id:', id);
    return result;
  } catch (err) {
    console.error('[AttendanceService] update ERROR:', err);
    throw err;
  }
}