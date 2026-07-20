import * as service from './service.js';
import logger from '../../config/logger.js';

export async function generate(req, res, next) {
  try {
    const { courseId, enrollmentId } = req.params;
    const result = await service.generateDiploma(courseId, enrollmentId);

    if (result.url) {
      res.locals.logSummary = `diploma generado: ${result.fileName}`;
      return res.status(201).json({ url: result.url, fileName: result.fileName });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.locals.logSummary = `diploma generado (sin Drive): ${result.fileName}`;
    return res.status(201).send(result.buffer);
  } catch (err) {
    logger.error({ err }, `[diplomas] generate — courseId:${req.params.courseId} enrollmentId:${req.params.enrollmentId}`);
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const { courseId, enrollmentId } = req.params;
    const diploma = await service.getDiploma(courseId, enrollmentId);
    res.json({ url: diploma.drive_url, generatedAt: diploma.generated_at });
  } catch (err) {
    next(err);
  }
}
