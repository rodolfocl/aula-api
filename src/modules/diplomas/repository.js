import db from '../../db/db.js';

export async function findByCourseAndEnrollment(courseId, enrollmentId) {
  return db('diplomas as d')
    .join('enrollments as e', 'd.enrollment_id', 'e.id')
    .where('e.id', enrollmentId)
    .where('e.course_id', courseId)
    .select('d.*')
    .first();
}

export async function upsert(enrollmentId, { driveFileId, driveUrl }) {
  const existing = await db('diplomas').where({ enrollment_id: enrollmentId }).first();
  if (existing) {
    const [row] = await db('diplomas')
      .where({ enrollment_id: enrollmentId })
      .update({ drive_file_id: driveFileId, drive_url: driveUrl, generated_at: db.fn.now() })
      .returning('*');
    return row;
  }
  const [row] = await db('diplomas')
    .insert({ enrollment_id: enrollmentId, drive_file_id: driveFileId, drive_url: driveUrl })
    .returning('*');
  return row;
}

export async function findDiplomaData(courseId, enrollmentId) {
  return db('enrollments as e')
    .join('courses as ci', 'e.course_id', 'ci.id')
    .join('course_templates as ct', 'ci.template_id', 'ct.id')
    .join('users as student', 'e.student_id', 'student.id')
    .join('users as teacher', 'ci.teacher_id', 'teacher.id')
    .where('e.id', enrollmentId)
    .where('e.course_id', courseId)
    .select(
      'student.full_name as student_name',
      'ct.name as course_name',
      'ci.year',
      'ci.period',
      'ci.start_date',
      'ci.end_date',
      'ci.status as course_status',
      'teacher.full_name as teacher_name',
      'e.final_grade',
    )
    .first();
}

export async function findAttendanceCounts(enrollmentId) {
  const row = await db('attendance')
    .where({ enrollment_id: enrollmentId })
    .select(
      db.raw(`COUNT(CASE WHEN status = 'present' THEN 1 END)::int AS present_count`),
      db.raw(`COUNT(CASE WHEN status = 'absent'  THEN 1 END)::int AS absent_count`),
    )
    .first();
  return {
    present_count: row?.present_count ?? 0,
    absent_count:  row?.absent_count  ?? 0,
  };
}
