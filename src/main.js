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
import morgan from 'morgan';

morgan.token('data', (req) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const body = { ...req.body };
    if (body.password) body.password = '***';
    if (body.password_hash) body.password_hash = '***';
    return Object.keys(body).length ? `| data: ${JSON.stringify(body)}` : '';
  }
  return Object.keys(req.query).length ? `| query: ${JSON.stringify(req.query)}` : '';
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(morgan(':method :url :status :response-time ms :data'));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/courses', coursesRoutes);
app.use('/course-instances', courseInstancesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/attendance', attendanceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});