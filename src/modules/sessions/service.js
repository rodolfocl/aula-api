import * as repository from './repository.js';

export async function getByInstance(instanceId) {
  try {
    console.log('[SessionsService] getByInstance — instanceId:', instanceId);
    const sessions = await repository.findByInstance(instanceId);
    console.log('[SessionsService] getByInstance — sesiones encontradas:', sessions.length);
    return sessions;
  } catch (err) {
    console.error('[SessionsService] getByInstance ERROR:', err);
    throw err;
  }
}

export async function create(data) {
  try {
    console.log('[SessionsService] create — creando sesión:', data);
    const session = await repository.create(data);
    console.log('[SessionsService] create — sesión creada, id:', session.id);
    return session;
  } catch (err) {
    console.error('[SessionsService] create ERROR:', err);
    throw err;
  }
}

export async function update(id, data) {
  try {
    console.log('[SessionsService] update — actualizando sesión id:', id, '| campos:', Object.keys(data));
    const session = await repository.findById(id);
    if (!session) {
      console.log('[SessionsService] update — sesión no encontrada, id:', id);
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    const result = await repository.update(id, data);
    console.log('[SessionsService] update — sesión actualizada, id:', id);
    return result;
  } catch (err) {
    console.error('[SessionsService] update ERROR:', err);
    throw err;
  }
}