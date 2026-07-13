import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './config/logger.js';
import { errorHandler } from './middlewares/error.handler.js';
import { batchMiddleware } from './middlewares/batch-logger.js';
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import courseTemplatesRoutes from './modules/course_templates/routes.js';
import coursesRoutes from './modules/courses/routes.js';
import enrollmentsRoutes from './modules/enrollments/routes.js';
import sessionsRoutes from './modules/sessions/routes.js';
import attendanceRoutes from './modules/attendance/routes.js';
import evaluationsRoutes from './modules/evaluations/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import calendarRoutes from './modules/calendar/routes.js';
import adminRoutes from './modules/admin/routes.js';
import driveRoutes from './modules/drive/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ exposedHeaders: ['X-Renewed-Token'] }));
app.use(express.json({ limit: '4mb' }));

// batchMiddleware debe ir ANTES de pinoHttp para que su listener de 'finish'
// se registre primero y corra antes que el de pinoHttp.
app.use(batchMiddleware);

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      // ignore se evalúa en tiempo de REQUEST (antes de next()), no en finish.
      // Por eso chequeamos el header directamente — req._batchSuppressed no
      // estaría disponible aún en ese momento.
      ignore: (req) => !!req.headers['x-batch-id'],
    },
    customSuccessMessage: (req, res, responseTime) => {
      const clientRoute = req.headers['x-client-route'];
      const context = clientRoute ? ` [${clientRoute.replace(/^\//, '')}]` : '';
      const summary = res.locals?.logSummary ? ` — ${res.locals.logSummary}` : '';
      return `${req.method} ${req.originalUrl} ${res.statusCode} (${Math.round(responseTime)}ms)${context}${summary}`;
    },
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (_req, res) => {
      const props = {};
      if (res.locals?.logErr) props.err = res.locals.logErr;
      return props;
    },
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
  })
);

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/course-templates', courseTemplatesRoutes);
app.use('/courses', coursesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/evaluations', evaluationsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/calendar', calendarRoutes);
app.use('/admin', adminRoutes);
app.use('/drive', driveRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
