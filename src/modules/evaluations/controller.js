import * as service from './service.js';
import {
  assertOwnerOrAdmin,
  assertCourseIsActive,
  getCourseInstanceIdFromEvaluation,
} from '../../utils/courseAuth.js';

export async function getByCourseInstance(req, res, next) {
  try {
    const evals = await service.getByCourseInstance(req.params.id);
    res.locals.logSummary = `${evals.length} evaluaciones`;
    res.json(evals);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    await assertOwnerOrAdmin(req, req.params.id);
    await assertCourseIsActive(req.params.id);
    const evaluation = await service.create(req.params.id, req.body);
    res.locals.logSummary = `creada: ${req.body.name}`;
    res.status(201).json(evaluation);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromEvaluation(req.params.id);
    if (courseInstanceId != null) {
      await assertOwnerOrAdmin(req, courseInstanceId);
      await assertCourseIsActive(courseInstanceId);
    }
    const evaluation = await service.update(req.params.id, req.body);
    res.locals.logSummary = `actualizó: ${Object.keys(req.body).join(', ')}`;
    res.json(evaluation);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromEvaluation(req.params.id);
    if (courseInstanceId != null) {
      await assertOwnerOrAdmin(req, courseInstanceId);
      await assertCourseIsActive(courseInstanceId);
    }
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function getGradesTable(req, res, next) {
  try { res.json(await service.getGradesTable(req.params.id)); } catch (err) { next(err); }
}

export async function getGrades(req, res, next) {
  try {
    const grades = await service.getGrades(req.params.id);
    res.locals.logSummary = `${grades.length} notas`;
    res.json(grades);
  } catch (err) { next(err); }
}

export async function saveGrades(req, res, next) {
  try {
    const courseInstanceId = await getCourseInstanceIdFromEvaluation(req.params.id);
    if (courseInstanceId != null) {
      await assertOwnerOrAdmin(req, courseInstanceId);
      await assertCourseIsActive(courseInstanceId);
    }
    const result = await service.saveGrades(req.params.id, req.body.grades);
    res.locals.logSummary = `${req.body.grades?.length ?? 0} notas guardadas`;
    res.json(result);
  } catch (err) { next(err); }
}
