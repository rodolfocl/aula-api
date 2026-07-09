import { getAuthUrl, encrypt, exchangeCode } from '../../utils/googleCalendarService.js';
import db from '../../db/db.js';
import logger from '../../config/logger.js';

export async function googleConnect(req, res, next) {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export async function googleStatus(req, res, next) {
  try {
    const row = await db('google_integration').orderBy('id', 'desc').first();
    if (!row) return res.json({ connected: false });
    res.json({ connected: true, email: row.connected_email, connected_at: row.connected_at });
  } catch (err) {
    next(err);
  }
}

export async function googleDisconnect(req, res, next) {
  try {
    await db('google_integration').delete();
    logger.info({ userId: req.user.sub }, 'googleDisconnect — integración eliminada');
    res.json({ message: 'Integración de Google desconectada correctamente' });
  } catch (err) {
    next(err);
  }
}

// Este handler lo llama /auth/google/callback (sin authMiddleware)
export async function googleCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    logger.info({ code: code ? 'presente' : 'ausente', error }, 'googleCallback — inicio');

    if (error || !code) {
      const err = new Error('Autorización denegada por Google: ' + (error ?? 'sin código'));
      err.status = 400;
      throw err;
    }

    logger.info('googleCallback — intercambiando code por tokens...');
    const tokens = await exchangeCode(code);
    logger.info({ hasRefreshToken: !!tokens.refresh_token, hasAccessToken: !!tokens.access_token }, 'googleCallback — tokens recibidos');

    if (!tokens.refresh_token) {
      const err = new Error('Google no devolvió refresh_token. Asegúrate de usar prompt=consent y access_type=offline.');
      err.status = 400;
      throw err;
    }

    logger.info('googleCallback — obteniendo email de la cuenta...');
    const { google } = await import('googleapis');
    const { buildOAuthClient } = await import('../../utils/googleCalendarService.js');
    const client = buildOAuthClient();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    logger.info({ email: userInfo.email }, 'googleCallback — email obtenido');

    const encrypted = encrypt(tokens.refresh_token);

    await db('google_integration').delete();
    await db('google_integration').insert({
      refresh_token_encrypted: encrypted,
      connected_email: userInfo.email,
      connected_at: new Date(),
    });

    logger.info({ email: userInfo.email }, 'googleCallback — integración guardada correctamente');
    res.json({ message: `Cuenta ${userInfo.email} conectada correctamente` });
  } catch (err) {
    logger.error({ err: { message: err.message, stack: err.stack } }, 'googleCallback — error');
    next(err);
  }
}
