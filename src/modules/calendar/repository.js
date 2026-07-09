import db from '../../db/db.js';

export async function findActiveInstancesInRange(rangeStart, rangeEnd, teacherId) {
  return db('courses as ci')
    .join('course_templates as ct', 'ci.template_id', 'ct.id')
    .join('users as u', 'ci.teacher_id', 'u.id')
    .select(
      'ci.id as course_instance_id',
      'ct.name as course_name',
      'u.full_name as teacher_name',
      'ci.schedule_time',
      'ci.day_of_week',
      'ci.start_date',
      'ci.end_date',
      db.raw(`(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = ci.id AND e.status <> 'withdrawn') AS student_count`),
    )
    .where('ci.status', 'active')
    .whereNotNull('ci.day_of_week')
    .where('ci.start_date', '<=', rangeEnd)
    .where(function () {
      this.whereNull('ci.end_date').orWhere('ci.end_date', '>=', rangeStart);
    })
    .modify(q => { if (teacherId) q.where('ci.teacher_id', teacherId); });
}