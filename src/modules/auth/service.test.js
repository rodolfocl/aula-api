import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Estado compartido que controla el comportamiento de los mocks entre tests
const state = {
  userInDb: null,
  userByToken: null,
  emailSentTo: null,
  emailCallCount: 0,
  setResetTokenCallCount: 0,
  clearResetTokenCalledWithId: null,
};

mock.module('../../utils/email.js', {
  namedExports: {
    sendPasswordResetEmail: async (email, _fullName, _link) => {
      state.emailCallCount++;
      state.emailSentTo = email;
    },
  },
});

mock.module('./repository.js', {
  namedExports: {
    findByEmail: async (_email) => state.userInDb,
    setResetToken: async (_email, _token, _exp) => {
      state.setResetTokenCallCount++;
    },
    findByResetToken: async (_token) => state.userByToken,
    clearResetToken: async (id, _hash) => {
      state.clearResetTokenCalledWithId = id;
    },
    findById: async (_id) => null,
    updatePassword: async () => null,
    create: async () => null,
  },
});

mock.module('../../config/logger.js', {
  defaultExport: { error: mock.fn(), info: mock.fn() },
});

const { forgotPassword, resetPassword } = await import('./service.js');

describe('forgotPassword', () => {
  beforeEach(() => {
    state.userInDb = null;
    state.emailSentTo = null;
    state.emailCallCount = 0;
    state.setResetTokenCallCount = 0;
  });

  it('envía el email AL correo del usuario que coincide, no a un correo fijo', async () => {
    state.userInDb = { id: 42, email: 'alumno@ejemplo.com', full_name: 'Ana López' };

    await forgotPassword({ email: 'alumno@ejemplo.com' });

    assert.equal(state.emailCallCount, 1, 'Debe enviarse exactamente 1 email');
    assert.equal(
      state.emailSentTo,
      'alumno@ejemplo.com',
      `El destinatario debe ser el email del usuario, no una cuenta fija de admin`,
    );
  });

  it('NO envía ningún email si el correo ingresado no existe en la BD', async () => {
    state.userInDb = null;

    await forgotPassword({ email: 'fantasma@ejemplo.com' });

    assert.equal(state.emailCallCount, 0, 'No debe enviarse ningún email');
  });

  it('devuelve el mismo mensaje genérico exista o no el usuario (evita user enumeration)', async () => {
    state.userInDb = null;
    const { message: msgNoExiste } = await forgotPassword({ email: 'noexiste@ejemplo.com' });

    state.userInDb = { id: 1, email: 'si@existe.com', full_name: 'Usuario Real' };
    const { message: msgSiExiste } = await forgotPassword({ email: 'si@existe.com' });

    assert.ok(msgNoExiste, 'Debe retornar un mensaje cuando el usuario no existe');
    assert.equal(
      msgNoExiste,
      msgSiExiste,
      'El mensaje debe ser idéntico en ambos casos para no revelar si el email está registrado',
    );
  });

  it('invoca setResetToken cuando el usuario existe (token será guardado en BD)', async () => {
    state.userInDb = { id: 5, email: 'u@e.com', full_name: 'User' };
    const antes = state.setResetTokenCallCount;

    await forgotPassword({ email: 'u@e.com' });

    assert.ok(
      state.setResetTokenCallCount > antes,
      'setResetToken debe ser invocado para guardar el token hasheado en la BD',
    );
  });
});

describe('resetPassword', () => {
  beforeEach(() => {
    state.userByToken = null;
    state.clearResetTokenCalledWithId = null;
  });

  it('invalida el token después de usarlo (clearResetToken se llama con el id correcto)', async () => {
    state.userByToken = { id: 7, email: 'u@e.com' };

    await resetPassword({ token: 'token-valido', new_password: 'NuevaClave123' });

    assert.equal(
      state.clearResetTokenCalledWithId,
      7,
      'clearResetToken debe llamarse con el id del usuario del token',
    );
  });

  it('lanza error 400 si el token es inválido o expirado', async () => {
    state.userByToken = null;

    await assert.rejects(
      () => resetPassword({ token: 'token-inexistente', new_password: 'abc' }),
      (err) => {
        assert.equal(err.status, 400, 'Debe responder con status 400');
        return true;
      },
    );
  });
});
