const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía email de confirmación al cliente.
 */
async function sendConfirmationEmail(client, isNew) {
  const subject = isNew
    ? '¡Bienvenido a Do It Fitness Club! 🏋️'
    : '¡Membresía renovada con éxito! 💪';

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;">
      <h2 style="color:#1a1a1a;">${subject}</h2>
      <p>Hola <strong>${client.nombre}</strong>,</p>
      <p>${isNew
        ? 'Tu membresía ha sido activada exitosamente.'
        : 'Tu membresía ha sido renovada exitosamente.'
      }</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Plan</strong></td>
            <td style="padding:8px;border:1px solid #eee;">${client.plan}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Valor</strong></td>
            <td style="padding:8px;border:1px solid #eee;">$${client.valor}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Email</strong></td>
            <td style="padding:8px;border:1px solid #eee;">${client.email}</td></tr>
      </table>
      <p style="margin-top:24px;color:#666;">¡Te esperamos en el gym!</p>
      <p style="color:#999;font-size:12px;">Do It Fitness Club</p>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      client.email,
    subject,
    html,
  });
}

module.exports = { sendConfirmationEmail };
