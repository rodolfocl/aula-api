import * as repository from './repository.js';

export async function getAll({ includeInactive = false } = {}) {
  try {
    console.log('[CoursesService] getAll — includeInactive:', includeInactive);
    const courses = await repository.findAll({ includeInactive });
    console.log('[CoursesService] getAll — ramos encontrados:', courses.length);
    return courses;
  } catch (err) {
    console.error('[CoursesService] getAll ERROR:', err);
    throw err;
  }
}

export async function getById(id) {
  try {
    console.log('[CoursesService] getById — buscando ramo id:', id);
    const course = await repository.findById(id);
    if (!course) {
      console.log('[CoursesService] getById — ramo no encontrado, id:', id);
      const err = new Error('Ramo no encontrado');
      err.status = 404;
      throw err;
    }
    console.log('[CoursesService] getById — ramo encontrado, id:', course.id);
    return course;
  } catch (err) {
    console.error('[CoursesService] getById ERROR:', err);
    throw err;
  }
}

export async function create(data) {
  try {
    console.log('[CoursesService] create — creando ramo:', data.name);
    const course = await repository.create(data);
    console.log('[CoursesService] create — ramo creado, id:', course.id);
    return course;
  } catch (err) {
    console.error('[CoursesService] create ERROR:', err);
    throw err;
  }
}

export async function update(id, data) {
  try {
    console.log('[CoursesService] update — actualizando ramo id:', id, '| campos:', Object.keys(data));
    await getById(id);
    const course = await repository.update(id, data);
    console.log('[CoursesService] update — ramo actualizado, id:', id);
    return course;
  } catch (err) {
    console.error('[CoursesService] update ERROR:', err);
    throw err;
  }
}

export async function remove(id) {
  try {
    console.log('[CoursesService] remove — soft delete ramo id:', id);
    await getById(id);
    const result = await repository.softDelete(id);
    console.log('[CoursesService] remove — ramo desactivado, id:', id);
    return result;
  } catch (err) {
    console.error('[CoursesService] remove ERROR:', err);
    throw err;
  }
}