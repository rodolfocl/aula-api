import db from '../db/db.js';

export async function assertCourseIsActive(courseInstanceId) {
  const instance = await db('courses').where({ id: courseInstanceId }).select('status').first();
  if (!instance || instance.status !== 'active') {
    const err = new Error('No se puede modificar un curso que no está activo');
    err.status = 409;
    throw err;
  }
}

export async function getUserRoles(userId) {
  const user = await db('users').where({ id: userId }).select('roles').first();
  return user?.roles ?? [];
}

export async function assertOwnerOrAdmin(req, courseInstanceId) {
  const roles = await getUserRoles(req.user.sub);
  if (roles.includes('administrador')) return;

  const instance = await db('courses').where({ id: courseInstanceId }).select('teacher_id').first();
  if (!instance || instance.teacher_id !== req.user.sub) {
    const err = new Error('No tienes permiso para modificar este curso');
    err.status = 403;
    throw err;
  }
}

export async function getCourseInstanceIdFromSession(sessionId) {
  const session = await db('sessions').where({ id: sessionId }).select('course_id').first();
  return session?.course_id ?? null;
}

export async function getCourseInstanceIdFromEvaluation(evaluationId) {
  const evaluation = await db('evaluations').where({ id: evaluationId }).select('course_id').first();
  return evaluation?.course_id ?? null;
}

export async function getCourseInstanceIdFromAttendance(attendanceId) {
  const row = await db('attendance as a')
    .join('sessions as s', 'a.session_id', 's.id')
    .where('a.id', attendanceId)
    .select('s.course_id')
    .first();
  return row?.course_id ?? null;
}
