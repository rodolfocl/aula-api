import logger from '../../config/logger.js';
import * as repository from './repository.js';

export async function getSummary({ teacherId } = {}) {
  try {
    return await repository.getSummary({ teacherId });
  } catch (err) {
    logger.error({ err, teacherId }, 'dashboard.getSummary — error');
    throw err;
  }
}

export async function getAlerts() {
  try {
    return await repository.getAlerts();
  } catch (err) {
    logger.error({ err }, 'dashboard.getAlerts — error');
    throw err;
  }
}