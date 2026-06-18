import nodemailer from 'nodemailer';
import { config } from '../config/apis.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: config.gmail.user, pass: config.gmail.appPassword },
});

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Automation Engine" <${config.gmail.user}>`,
      to, subject, html,
    });
    logger.success(`Email sent to ${to} — ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Gmail sendEmail failed', err);
  }
}

export async function sendMatchReport(match) {
  const html = `
    <div style="font-family:Arial;background:#0d0d0d;color:#f0f0f0;padding:24px;border-radius:10px;">
      <h2 style="color:#e94560;">⚽ Match Report — FIFA World Cup 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="padding:12px;font-size:1.4rem;text-align:center;">${match.homeTeam}</td>
          <td style="padding:12px;font-size:2rem;font-weight:900;text-align:center;color:#e94560;">
            ${match.homeScore} — ${match.awayScore}
          </td>
          <td style="padding:12px;font-size:1.4rem;text-align:center;">${match.awayTeam}</td>
        </tr>
      </table>
      <p style="color:#aaa;margin-top:16px;">Status: ${match.status} | Competition: ${match.competition}</p>
    </div>`;
  return sendEmail({ to: config.gmail.user, subject: `⚽ ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`, html });
}
