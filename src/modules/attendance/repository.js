import db from '../../db/db.js';

export async function findByEnrollment(enrollmentId) {
  return db('attendance as a')
    .join('sessions as s', 'a.session_id', 's.id')
    .where('a.enrollment_id', enrollmentId)
    .select('a.*', 's.scheduled_at', 's.title')
    .orderBy('s.scheduled_at');
}

export async function findById(id) {
  return db('attendance').where({ id }).first();
}

export async function create(data) {
  const [record] = await db('attendance').insert(data).returning('*');
  return record;
}

export async function update(id, data) {
  const [record] = await db('attendance').where({ id }).update(data).returning('*');
  return record;
}

export async function findTableByInstance(instanceId) {
  const [sesiones, rows] = await Promise.all([
    db('sessions')
      .where({ offering_id: instanceId })
      .select('id', 'scheduled_at', 'title')
      .orderBy('scheduled_at'),

    db('enrollments as e')
      .join('users as u', 'e.student_id', 'u.id')
      .leftJoin('sessions as s', 's.offering_id', 'e.instance_id')
      .leftJoin('attendance as a', function () {
        this.on('a.enrollment_id', '=', 'e.id').andOn('a.session_id', '=', 's.id')
      })
      .where('e.instance_id', instanceId)
      .select('e.id as enrollment_id', 'u.full_name', 's.id as session_id', 'a.status')
      .orderBy(['u.full_name', 's.scheduled_at']),
  ])

  const alumnosOrden = []
  const seen = new Set()
  const index = {}

  for (const row of rows) {
    if (!seen.has(row.enrollment_id)) {
      seen.add(row.enrollment_id)
      alumnosOrden.push({ enrollment_id: row.enrollment_id, full_name: row.full_name })
      index[row.enrollment_id] = {}
    }
    if (row.session_id !== null) {
      index[row.enrollment_id][row.session_id] = row.status ?? null
    }
  }

  const sessionIds = sesiones.map(s => s.id)

  const filas = alumnosOrden.map(({ enrollment_id, full_name }) => {
    const asistencia = Object.fromEntries(
      sessionIds.map(sid => [sid, index[enrollment_id]?.[sid] ?? null])
    )
    const faltas = Object.values(asistencia).filter(s => s === 'absent').length
    return { enrollment_id, full_name, asistencia, faltas }
  })

  return { sesiones, filas }
}

export async function upsertBulk(records) {
  if (!records.length) return []
  const rows = records.map(r => ({
    session_id: r.session_id,
    enrollment_id: r.enrollment_id,
    status: r.status,
    recorded_at: new Date(),
  }))
  return db('attendance')
    .insert(rows)
    .onConflict(['session_id', 'enrollment_id'])
    .merge(['status', 'recorded_at'])
    .returning('*')
}