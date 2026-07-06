import * as repository from './repository.js';

export async function getByCourseInstance(courseInstanceId) {
  return repository.findByCourseInstance(courseInstanceId);
}

export async function create(courseInstanceId, data) {
  return repository.create({ ...data, course_id: courseInstanceId });
}

export async function update(id, data) {
  const evaluation = await repository.findById(id);
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }
  return repository.update(id, data);
}

export async function remove(id) {
  const evaluation = await repository.findById(id);
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }
  const hasGrades = await repository.hasGrades(id);
  if (hasGrades) {
    const err = new Error('No se puede eliminar una evaluación con notas registradas');
    err.status = 409;
    throw err;
  }
  await repository.remove(id);
}

export async function getGradesTable(courseInstanceId) {
  return repository.findGradesTable(courseInstanceId);
}

export async function getGrades(evaluationId) {
  const evaluation = await repository.findById(evaluationId);
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }
  return repository.findGradesByEvaluation(evaluationId);
}

export async function saveGrades(evaluationId, grades) {
  if (!Array.isArray(grades) || grades.length === 0) {
    const err = new Error('Se requiere al menos una nota para guardar');
    err.status = 422;
    throw err;
  }

  const evaluation = await repository.findById(evaluationId);
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }

  const normalized = grades.map((g) => {
    const raw = parseFloat(g.grade);
    if (isNaN(raw)) {
      const err = new Error(`Valor de nota inválido: "${g.grade}" (enrollment ${g.enrollment_id})`);
      err.status = 422;
      throw err;
    }
    const nota = Math.round(raw * 10) / 10;
    if (nota < 1.0 || nota > 7.0) {
      const err = new Error(`Nota ${nota} fuera del rango permitido 1.0–7.0 (enrollment ${g.enrollment_id})`);
      err.status = 422;
      throw err;
    }
    return { ...g, grade: nota };
  });

  return repository.upsertGrades(evaluationId, normalized);
}
