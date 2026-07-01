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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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