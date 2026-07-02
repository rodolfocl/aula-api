import db from '../../db/db.js';

export async function findByStudent(studentId) {
  return db('enrollments as e')
    .join('course_instances as ci', 'e.instance_id', 'ci.id')
    .join('courses as c', 'ci.course_id', 'c.id')
    .where('e.student_id', studentId)
    .select(
      'e.id',
      'e.status',
      'e.final_grade',
      'e.enrolled_at',
      'c.name as course_name',
      'ci.year',
      'ci.period',
      'ci.is_historical',
    )
    .orderBy([{ column: 'ci.year', order: 'desc' }, { column: 'ci.period', order: 'desc' }]);
}

export async function findByInstance(instanceId) {
  return db('enrollments as e')
    .join('users as u', 'e.student_id', 'u.id')
    .leftJoin('attendance as a', 'a.enrollment_id', 'e.id')
    .where('e.instance_id', instanceId)
    .groupBy('e.id', 'e.student_id', 'e.status', 'u.full_name', 'u.id')
    .select(
      'e.id',
      'e.student_id',
      'e.status',
      'u.full_name',
      db.raw(`COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absence_count`),
      db.raw(`COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count`),
    );
}

export async function findById(id) {
  return db('enrollments').where({ id }).first();
}

export async function create(data) {
  const [enrollment] = await db('enrollments').insert(data).returning('*');
  return enrollment;
}

export async function updateStatus(id, status) {
  const [enrollment] = await db('enrollments')
    .where({ id })
    .update({ status, updated_at: new Date() })
    .returning('*');
  return enrollment;
}