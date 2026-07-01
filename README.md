# Aula API

Backend de **Aula PDV** — plataforma educativa del Ministerio Pan de Vida.

## Stack

- **Node.js** v22+
- **Express v4** — framework HTTP
- **Knex v3** — query builder
- **PostgreSQL** — base de datos en Neon (serverless)
- **JWT + bcrypt** — autenticación

## Base de datos

6 tablas: `users`, `courses`, `course_instances`, `enrollments`, `sessions`, `attendance`

Hospedada en [Neon](https://neon.tech).

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/aula_pdv?sslmode=require"
PORT=3000
JWT_SECRET="tu_secreto"
```

## Desarrollo

```bash
npm run start:dev   # nodemon con hot-reload
npm run start       # producción
```

## API

Todas las rutas excepto `/auth/register` y `/auth/login` requieren header:

```
Authorization: Bearer <token>
```

| Ruta | Descripción |
|---|---|
| `POST /auth/register` | Registro de usuario |
| `POST /auth/login` | Login, devuelve JWT |
| `GET/PATCH/DELETE /users` | Gestión de usuarios |
| `GET/POST/PATCH/DELETE /courses` | Gestión de ramos (DELETE es soft) |
| `GET/POST/PATCH /course-instances` | Instancias de ramos |
| `GET/POST/PATCH /enrollments` | Inscripciones de alumnos |
| `GET/POST/PATCH /sessions` | Sesiones de clase |
| `GET/POST/PATCH /attendance` | Asistencia |