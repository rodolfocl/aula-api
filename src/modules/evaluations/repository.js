import db from '../../db/db.js';

export async function findByCourseInstance(courseInstanceId) {
  return db('evaluations')
    .where({ course_instance_id: courseInstanceId })
    .orderBy([{ column: 'date', order: 'asc', nulls: 'last' }, { column: 'created_at', order: 'asc' }]);
}

export async function findById(id) {
  return db('evaluations').where({ id }).first();
}

export async function create(data) {
  const [evaluation] = await db('evaluations').insert(data).returning('*');
  return evaluation;
}

export async function update(id, data) {
  const [evaluation] = await db('evaluations')
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning('*');
  return evaluation;
}

export async function remove(id) {
  return db('evaluations').where({ id }).delete();
}

export async function hasGrades(evaluationId) {
  const { count } = await db('grades').where({ evaluation_id: evaluationId }).count('id as count').first();
  return parseInt(count) > 0;
}

export async function findGradesByEvaluation(evaluationId) {
  return db('grades as g')
    .join('enrollments as e', 'g.enrollment_id', 'e.id')
    .join('users as u', 'e.student_id', 'u.id')
    .where('g.evaluation_id', evaluationId)
    .select('g.id', 'g.evaluation_id', 'g.enrollment_id', 'g.grade', 'g.comments', 'g.is_historical', 'u.full_name', 'e.student_id')
    .orderBy('u.full_name');
}

export async function findGradesTable(courseInstanceId) {
  const [evaluaciones, rows] = await Promise.all([
    db('evaluations')
      .where({ course_instance_id: courseInstanceId })
      .select('id', 'name', 'date')
      .orderBy([{ column: 'date', order: 'asc', nulls: 'last' }, { column: 'created_at', order: 'asc' }]),

    db('enrollments as e')
      .join('users as u', 'e.student_id', 'u.id')
      .leftJoin('evaluations as ev', 'ev.course_instance_id', 'e.instance_id')
      .leftJoin('grades as g', function () {
        this.on('g.enrollment_id', '=', 'e.id').andOn('g.evaluation_id', '=', 'ev.id')
      })
      .where('e.instance_id', courseInstanceId)
      .select('e.id as enrollment_id', 'u.full_name', 'ev.id as evaluation_id', 'g.grade')
      .orderBy('u.full_name'),
  ])

  const alumnosOrden = []
  const seen = new Set()
  const gradesIndex = {}

  for (const row of rows) {
    if (!seen.has(row.enrollment_id)) {
      seen.add(row.enrollment_id)
      alumnosOrden.push({ enrollment_id: row.enrollment_id, full_name: row.full_name })
      gradesIndex[row.enrollment_id] = {}
    }
    if (row.evaluation_id !== null) {
      gradesIndex[row.enrollment_id][row.evaluation_id] =
        row.grade !== null ? parseFloat(row.grade) : null
    }
  }

  const evalIds = evaluaciones.map((e) => e.id)

  const filas = alumnosOrden.map(({ enrollment_id, full_name }) => ({
    enrollment_id,
    full_name,
    notas: Object.fromEntries(evalIds.map((eid) => [eid, gradesIndex[enrollment_id]?.[eid] ?? null])),
  }))

  return { evaluaciones, filas }
}

export async function upsertGrades(evaluationId, grades) {
  const rows = grades.map((g) => ({
    evaluation_id: evaluationId,
    enrollment_id: g.enrollment_id,
    grade: g.grade,
    comments: g.comments ?? null,
    updated_at: new Date(),
  }));

  return db('grades')
    .insert(rows)
    .onConflict(['evaluation_id', 'enrollment_id'])
    .merge(['grade', 'comments', 'updated_at'])
    .returning('*');
}