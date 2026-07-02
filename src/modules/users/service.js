import * as repository from './repository.js';

export async function getAll({ includeInactive = false } = {}) {
  try {
    console.log('[UsersService] getAll — obteniendo usuarios, includeInactive:', includeInactive);
    const users = await repository.findAll({ includeInactive });
    console.log('[UsersService] getAll — usuarios encontrados:', users.length);
    return users;
  } catch (err) {
    console.error('[UsersService] getAll ERROR:', err);
    throw err;
  }
}

export async function getById(id) {
  try {
    console.log('[UsersService] getById — buscando usuario id:', id);
    const user = await repository.findById(id);
    if (!user) {
      console.log('[UsersService] getById — usuario no encontrado, id:', id);
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }
    console.log('[UsersService] getById — usuario encontrado, id:', user.id);
    return user;
  } catch (err) {
    console.error('[UsersService] getById ERROR:', err);
    throw err;
  }
}

export async function update(id, data) {
  try {
    console.log('[UsersService] update — actualizando usuario id:', id, '| campos:', Object.keys(data));
    const user = await repository.update(id, data);
    console.log('[UsersService] update — usuario actualizado, id:', id);
    return user;
  } catch (err) {
    console.error('[UsersService] update ERROR:', err);
    throw err;
  }
}

export async function remove(id) {
  try {
    console.log('[UsersService] remove — eliminando usuario id:', id);
    const result = await repository.remove(id);
    console.log('[UsersService] remove — usuario eliminado, id:', id);
    return result;
  } catch (err) {
    console.error('[UsersService] remove ERROR:', err);
    throw err;
  }
}