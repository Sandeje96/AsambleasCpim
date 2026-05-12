import nodemailer from "nodemailer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface AlertaEmailData {
  to: string;
  asambleaAño: number;
  items: {
    nombre: string;
    fechaPlanificada: Date;
    fechaEstricta: Date;
    diasRestantes: number;
    urgente: boolean;
  }[];
}

export async function enviarAlertaDeadlines(data: AlertaEmailData) {
  const { to, asambleaAño, items } = data;

  const filas = items
    .map((item) => {
      const urgenciaColor = item.urgente ? "#dc2626" : "#d97706";
      const urgenciaTexto = item.urgente ? "⚠️ URGENTE" : "📅 Próximo";
      return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:10px 12px;font-size:14px">${item.nombre}</td>
        <td style="padding:10px 12px;font-size:14px;text-align:center">
          ${format(item.fechaPlanificada, "dd/MM/yyyy", { locale: es })}
        </td>
        <td style="padding:10px 12px;font-size:14px;text-align:center;color:#6b7280">
          ${format(item.fechaEstricta, "dd/MM/yyyy", { locale: es })}
        </td>
        <td style="padding:10px 12px;font-size:13px;text-align:center;font-weight:600;color:${urgenciaColor}">
          ${urgenciaTexto} (${item.diasRestantes}d)
        </td>
      </tr>`;
    })
    .join("");

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
    <div style="max-width:700px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

      <div style="background:#1e3a5f;padding:24px 32px">
        <h1 style="color:white;margin:0;font-size:20px">
          Consejo Profesional de Ingeniería de Misiones
        </h1>
        <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">
          Recordatorio – Asamblea Ordinaria ${asambleaAño}
        </p>
      </div>

      <div style="padding:24px 32px">
        <p style="color:#374151;font-size:15px;margin-top:0">
          Este es un recordatorio automático de las fechas legales próximas a vencer
          para la Asamblea Ordinaria ${asambleaAño}.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280">Paso</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280">Fecha Planificada</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280">Fecha Límite</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280">Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:6px;border-left:4px solid #f59e0b">
          <p style="margin:0;font-size:13px;color:#92400e">
            <strong>Importante:</strong> Las fechas límite son inamovibles según la Ley I-N°11
            y la Disposición N°25 de Personería Jurídica. El incumplimiento puede generar multas.
          </p>
        </div>
      </div>

      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
          Sistema de Gestión de Asambleas – CPIM
        </p>
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "CPIM Asambleas <noreply@cpim.ar>",
    to,
    subject: `[CPIM] Recordatorio Asamblea ${asambleaAño} – Fechas próximas a vencer`,
    html,
  });
}

export async function enviarAlertaTest(to: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "CPIM Asambleas <noreply@cpim.ar>",
    to,
    subject: "[CPIM] Prueba de configuración de email",
    html: `<p>El sistema de alertas de CPIM está funcionando correctamente.</p>
           <p>Recibirás recordatorios automáticos en esta dirección.</p>`,
  });
}
