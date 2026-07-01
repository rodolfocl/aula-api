import db from '../../db/db.js';

export async function findByStudent(studentId) {
  return db('enrollments as e')
    .join('course_instances as ci', 'e.offering_id', 'ci.id')
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
    )
    .orderBy('ci.year', 'desc');
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