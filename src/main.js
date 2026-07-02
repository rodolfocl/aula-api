import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.handler.js';
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import coursesRoutes from './modules/courses/routes.js';
import courseInstancesRoutes from './modules/course_instances/routes.js';
import enrollmentsRoutes from './modules/enrollments/routes.js';
import sessionsRoutes from './modules/sessions/routes.js';
import attendanceRoutes from './modules/attendance/routes.js';
import evaluationsRoutes from './modules/evaluations/routes.js';
import morgan from 'morgan';

const morganFormat = (tokens, req, res) => {
  const method = tokens.method(req, res);
  let extra = '';
  if (['POST', 'PUT', 'PATCH'].includes(method) && Object.keys(req.body || {}).length) {
    const body = { ...req.body };
    if (body.password) body.password = '***';
    if (body.password_hash) body.password_hash = '***';
    extra = ` | body: ${JSON.stringify(body)}`;
  }
  return `${method} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens['response-time'](req, res)}ms${extra}`;
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(morgan(morganFormat));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/courses', coursesRoutes);
app.use('/course-instances', courseInstancesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/evaluations', evaluationsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});