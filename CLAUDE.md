# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run start:dev    # nodemon con hot-reload
npm run start        # node puro (producción)
```

Variables de entorno requeridas en `.env`: `DATABASE_URL`, `PORT`, `JWT_SECRET`.

## Stack

**Express v4 + JavaScript ESM** (`"type": "module"` en package.json). Sin TypeScript. Runtime: Node.js 22.

- **ORM:** Knex v3 con driver `pg` — cliente único en `src/db/db.js`
- **Auth:** JWT (`jsonwebtoken`) + bcrypt
- **Logging:** Morgan con formato personalizado en `main.js`

## Arquitectura

### Flujo de una request

```
routes.js → controller.js → service.js → repository.js → db.js (Knex)
```

- **routes.js** — define el Router de Express y aplica `authMiddleware` con `router.use(authMiddleware)` al inicio del archivo (todas las rutas del módulo quedan protegidas)
- **controller.js** — maneja `req`/`res`, delega al service, llama `next(err)` en el catch
- **service.js** — lógica de negocio; lanza errores HTTP con `err.status = 404` (el `errorHandler` los captura)
- **repository.js** — acceso a BD con Knex; siempre usa `.returning('*')` en inserts y updates

### Manejo de errores

El patrón para errores HTTP es consistente en todo el proyecto:

```javascript
const err = new Error('Mensaje');
err.status = 404;
throw err;
```

`src/middlewares/error.handler.js` captura cualquier error pasado a `next(err)` y responde con `{ error: message }`.

### Auth

`POST /auth/register` es el único punto de creación de usuarios. Acepta `full_name`, `email`, `password`, `phone` (opcional), `photo_url` (opcional). Los passwords se guardan como `password_hash` en la tabla `users`.

El JWT tiene payload `{ sub: userId, email }` y expira en 7 días. `req.user` queda disponible en todos los handlers protegidos con el payload del token.

`POST /auth/login` devuelve solo `{ token }`.

### Módulos y rutas

| Módulo | Ruta base | Auth |
|---|---|---|
| auth | `/auth` | No (register y login son públicos) |
| users | `/users` | Sí |
| courses | `/courses` | Sí |
| course_instances | `/course-instances` | Sí |
| enrollments | `/enrollments` | Sí |
| sessions | `/sessions` | Sí |
| attendance | `/attendance` | Sí |

`courses DELETE /:id` hace soft delete (`active = false`), no elimina el registro.

`enrollments PATCH /:id/status` valida que el status sea uno de: `in_progress`, `approved`, `failed`, `withdrawn`.

`attendance POST /` toma `recorded_by` automáticamente de `req.user.sub` en el controller.

### Queries con joins

Los repositories que hacen joins usan aliases de tabla (`'enrollments as e'`, `'courses as c'`). Ver `enrollments/repository.js` y `course_instances/repository.js` como referencia.

### Logger utilitario

`src/utils/logger.js` exporta `Repository`, `Service` y `Controller` para logging estructurado:

```javascript
import { Repository } from '../../utils/logger.js';
Repository.info('findById', 'Buscando id:', id);
Repository.error('findById', 'Error:', err);
```

Produce: `[Repository] [findById] Buscando id: 123`