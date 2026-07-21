import { Resend } from 'resend';
import logger from '../config/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email, fullName, resetLink) {
  const subject = 'Recuperación de contraseña';
  const { data, error } = await resend.emails.send({
    from: 'Aula PDV <no-reply@aulapdv.cl>',
    to: email,
    subject,
    html: `
      <p>Hola ${fullName},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetLink}">Restablecer contraseña</a></p>
      <p>Este link expira en 1 hora. Si no solicitaste esto, ignorá este email.</p>
    `,
  });

  if (error) {
    logger.error({ to: email, subject, resendError: error }, 'sendPasswordResetEmail — fallo al enviar');
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info({ to: email, subject, messageId: data?.id }, 'sendPasswordResetEmail — enviado correctamente');
}