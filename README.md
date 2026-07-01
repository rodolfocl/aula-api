# Aula API

Backend de **Aula PDV** — plataforma educativa del Ministerio Pan de Vida.

## Stack

- **Node.js** v24
- **NestJS** — framework principal
- **Prisma** — ORM y conexión a base de datos
- **PostgreSQL 18** — base de datos en Neon

## Base de datos

6 tablas: `users`, `courses`, `course_instances`, `enrollments`, `sessions`, `attendance`

Hospedada en [Neon](https://neon.tech) — PostgreSQL serverless gratuito.

## Requisitos

- Node.js 22+
- npm

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/aula_pdv?sslmode=require"
```

## Desarrollo

```bash
npm run start:dev
```

## Prisma

Generar cliente después de cambios en el schema:

```bash
npx prisma generate
```

Sincronizar modelos desde la BD:

```bash
npx prisma db pull
```