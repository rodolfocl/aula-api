import db from '../../db/db.js';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function todayES() {
  return DAYS_ES[new Date().getDay()];
}

export async function getSummary({ teacherId } = {}) {
  const today = todayES();

  const clasesHoyQuery = db('courses as c')
    .join('course_templates as ct', 'c.template_id', 'ct.id')
    .join('users as u', 'c.teacher_id', 'u.id')
    .where('c.status', 'active')
    .where('c.day_of_week', today)
    .select('c.id', 'ct.name as course_name', 'u.full_name as teacher_name', 'c.schedule_time')
    .orderBy('c.schedule_time');

  if (teacherId) {
    clasesHoyQuery.where('c.teacher_id', teacherId);
    const clasesHoy = await clasesHoyQuery;
    return { today, clasesHoy };
  }

  const [
    cursos,
    profesores,
    alumnos,
    sesiones,
    clasesHoy,
  ] = await Promise.all([
    db('courses').where('status', 'active').count('id as count').first(),
    db('users as u')
      .join('courses as c', 'c.teacher_id', 'u.id')
      .where('c.status', 'active')
      .where('u.active', true)
      .whereRaw("('profesor' = ANY(u.roles) OR 'administrador' = ANY(u.roles))")
      .countDistinct('u.id as count')
      .first(),
    db('enrollments as e')
      .join('courses as c', 'e.course_id', 'c.id')
      .where('c.status', 'active')
      .where('e.status', 'in_progress')
      .countDistinct('e.student_id as count')
      .first(),
    db('sessions as s')
      .join('courses as c', 's.course_id', 'c.id')
      .where('c.status', 'active')
      .whereRaw("s.scheduled_at >= date_trunc('week', NOW()) AND s.scheduled_at < date_trunc('week', NOW()) + interval '7 days'")
      .count('s.id as count')
      .first(),
    clasesHoyQuery,
  ]);

  return {
    today,
    metrics: {
      cursosActivos: parseInt(cursos.count),
      profesoresActivos: parseInt(profesores.count),
      alumnosInscritos: parseInt(alumnos.count),
      sesionesEstaSemana: parseInt(sesiones.count),
    },
    clasesHoy,
  };
}

export async function getAlerts() {
  const [asistenciaResult, riesgoResult] = await Promise.all([
    db.raw(`
      SELECT
        c.id AS course_id,
        ct.name AS course_name,
        ROUND(
          COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric /
          NULLIF(COUNT(CASE WHEN a.status IN ('present', 'absent') THEN 1 END), 0) * 100
        , 1) AS attendance_pct
      FROM courses c
      JOIN course_templates ct ON c.template_id = ct.id
      LEFT JOIN sessions s ON s.course_id = c.id
      LEFT JOIN attendance a ON a.session_id = s.id
      WHERE c.status = 'active'
      GROUP BY c.id, ct.name
      HAVING
        COUNT(CASE WHEN a.status IN ('present', 'absent') THEN 1 END) > 0
        AND COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric /
          NULLIF(COUNT(CASE WHEN a.status IN ('present', 'absent') THEN 1 END), 0) < 0.70
      ORDER BY attendance_pct ASC
    `),
    db.raw(`
      SELECT
        u.full_name AS student_name,
        ct.name AS course_name,
        ROUND(AVG(g.grade)::numeric, 2) AS avg_grade
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN evaluations ev ON g.evaluation_id = ev.id
      JOIN courses c ON ev.course_id = c.id
      JOIN course_templates ct ON c.template_id = ct.id
      JOIN users u ON e.student_id = u.id
      WHERE c.status = 'active'
      GROUP BY u.id, u.full_name, c.id, ct.name
      HAVING AVG(g.grade) < 4.0
      ORDER BY avg_grade ASC
    `),
  ]);

  return {
    cursosAsistenciaBaja: asistenciaResult.rows,
    alumnosEnRiesgo: riesgoResult.rows,
  };
}