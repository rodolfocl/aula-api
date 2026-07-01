import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email, fullName, resetLink) {
  await resend.emails.send({
    from: 'Aula PDV <no-reply@aulapdv.cl>',
    to: email,
    subject: 'Recuperación de contraseña',
    html: `
      <p>Hola ${fullName},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetLink}">Restablecer contraseña</a></p>
      <p>Este link expira en 1 hora. Si no solicitaste esto, ignorá este email.</p>
    `,
  });
}