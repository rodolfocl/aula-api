// NOTE: Esta estructura en memoria (Map) funciona solo en deployments de
// un único proceso Node.js. Para entornos con múltiples instancias /
// load balancer, reemplazar con almacenamiento compartido (ej: Redis)
// para que todas las instancias contribuyan al mismo acumulador de batch.

import logger from '../config/logger.js';

const DEBOUNCE_MS = 450;
const SAFETY_TIMEOUT_MS = 4000;
const MAX_BATCH_ID_LENGTH = 32;

const batches = new Map();

export function batchMiddleware(req, res, next) {
  const batchId = req.headers['x-batch-id'];
  if (!batchId || batchId.length > MAX_BATCH_ID_LENGTH) return next();

  const startTime = Date.now();

  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (res.statusCode >= 400) {
      // pinoHttp no tiene listener de 'finish' para requests con X-Batch-Id
      // (fue suprimido via autoLogging.ignore en tiempo de request). Logueamos
      // el error nosotros mismos para que nunca quede silenciado.
      const summary = res.locals?.logSummary ? ` — ${res.locals.logSummary}` : '';
      const clientRoute = req.headers['x-client-route'];
      const context = clientRoute ? ` [${clientRoute.replace(/^\//, '')}]` : '';
      const msg = `${req.method} ${req.originalUrl} ${res.statusCode} (${Math.round(duration)}ms)${context}${summary}`;

      if (res.statusCode >= 500) {
        logger.error({ err: res.locals?.logErr }, msg);
      } else {
        logger.warn(msg);
      }

      noteError(batchId, startTime);
      return;
    }

    // Éxito: acumular en el batch (pinoHttp ya suprimido).
    accumulate(batchId, req, res, startTime, endTime);
  });

  next();
}

function getOrCreateBatch(batchId, firstStartTime) {
  if (!batches.has(batchId)) {
    batches.set(batchId, {
      startTime: firstStartTime,
      requests: [],
      errors: 0,
      timer: null,
      safetyTimer: null,
    });
  }
  return batches.get(batchId);
}

function scheduledFlush(batchId, batch) {
  clearTimeout(batch.timer);
  batch.timer = setTimeout(() => flush(batchId), DEBOUNCE_MS);

  if (!batch.safetyTimer) {
    // Safety timeout: si el batch nunca "cierra" (ej: request derivada que nunca llega),
    // imprimir el resumen igual con lo acumulado para no perder visibilidad.
    batch.safetyTimer = setTimeout(() => flush(batchId), SAFETY_TIMEOUT_MS);
  }
}

function noteError(batchId, startTime) {
  const batch = getOrCreateBatch(batchId, startTime);
  batch.errors++;
  scheduledFlush(batchId, batch);
}

function accumulate(batchId, req, res, startTime, endTime) {
  const batch = getOrCreateBatch(batchId, startTime);

  batch.requests.push({
    method: req.method,
    url: req.originalUrl,
    logSummary: res.locals?.logSummary,
    params: { ...req.params },
    clientRoute: req.headers['x-client-route'] || null,
    startTime,
    endTime,
  });

  scheduledFlush(batchId, batch);
}

function flush(batchId) {
  const batch = batches.get(batchId);
  if (!batch) return;

  clearTimeout(batch.timer);
  clearTimeout(batch.safetyTimer);
  batches.delete(batchId);

  const { requests, errors } = batch;
  if (requests.length === 0 && errors === 0) return;

  const sorted = [...requests].sort((a, b) => a.startTime - b.startTime);
  const parent = sorted[0];
  const derived = sorted.slice(1);

  const firstStart = parent?.startTime ?? batch.startTime;
  const lastEnd = sorted.length > 0 ? Math.max(...sorted.map(r => r.endTime)) : Date.now();
  const totalDuration = lastEnd - firstStart;

  let msg = '';

  if (parent) {
    const context = parent.clientRoute ? ` [${parent.clientRoute.replace(/^\//, '')}]` : '';
    msg += `${parent.method} ${parent.url}${context}`;
    if (parent.logSummary) msg += ` → ${parent.logSummary}`;
  }

  if (derived.length > 0) {
    const ids = derived.map(r => extractId(r));
    msg += ` [${ids.join(', ')}]`;

    const aggregated = aggregateSummaries(derived.map(r => r.logSummary).filter(Boolean));
    if (aggregated) msg += ` — ${aggregated}`;
  }

  if (errors > 0) {
    const sep = msg.includes(' — ') ? ',' : ' —';
    msg += `${sep} ${errors} error${errors > 1 ? 'es' : ''}`;
  }

  msg += ` (${totalDuration}ms)`;

  logger.info(msg);
}

function extractId(request) {
  const paramValues = Object.values(request.params);
  if (paramValues.length > 0) return paramValues[0];
  const segments = request.url.split('?')[0].split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '?';
}

function aggregateSummaries(summaries) {
  const totals = new Map();
  for (const s of summaries) {
    const match = s.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const unit = match[2];
      totals.set(unit, (totals.get(unit) || 0) + n);
    }
  }
  if (totals.size === 0) return summaries.join('; ');
  return [...totals.entries()].map(([unit, n]) => `${n} ${unit}`).join(', ') + ' totales';
}
