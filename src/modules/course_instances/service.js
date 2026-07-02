import * as repository from './repository.js';

export async function getAll({ year, teacherId, status } = {}) {
  try {
    console.log('[CourseInstancesService] getAll — filtros:', { year, teacherId, status });
    const instances = await repository.findAll({ year, teacherId, status });
    console.log('[CourseInstancesService] getAll — instancias encontradas:', instances.length);
    return instances;
  } catch (err) {
    console.error('[CourseInstancesService] getAll ERROR:', err);
    throw err;
  }
}

export async function getById(id) {
  try {
    console.log('[CourseInstancesService] getById — buscando instancia id:', id);
    const instance = await repository.findById(id);
    if (!instance) {
      console.log('[CourseInstancesService] getById — instancia no encontrada, id:', id);
      const err = new Error('Instancia no encontrada');
      err.status = 404;
      throw err;
    }
    console.log('[CourseInstancesService] getById — instancia encontrada, id:', instance.id);
    return instance;
  } catch (err) {
    console.error('[CourseInstancesService] getById ERROR:', err);
    throw err;
  }
}

export async function create(data) {
  try {
    console.log('[CourseInstancesService] create — creando instancia:', data);
    const instance = await repository.create(data);
    console.log('[CourseInstancesService] create — instancia creada, id:', instance.id);
    return instance;
  } catch (err) {
    console.error('[CourseInstancesService] create ERROR:', err);
    throw err;
  }
}

export async function update(id, data) {
  try {
    console.log('[CourseInstancesService] update — actualizando instancia id:', id, '| campos:', Object.keys(data));
    await getById(id);
    const instance = await repository.update(id, data);
    console.log('[CourseInstancesService] update — instancia actualizada, id:', id);
    return instance;
  } catch (err) {
    console.error('[CourseInstancesService] update ERROR:', err);
    throw err;
  }
}