import axios from 'axios';
import logger from '../utils/logger.js';

const SLACK_API = 'https://slack.com/api';

function authHeaders() {
  return { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' };
}

/**
 * Post a plain text message to a Slack channel.
 * @param {string} channel — channel ID or name
 * @param {string} text
 */
export async function sendMessage(channel, text) {
  try {
    const res = await axios.post(`${SLACK_API}/chat.postMessage`, { channel, text }, { headers: authHeaders() });
    if (!res.data.ok) throw new Error(res.data.error);
    logger.success(`Slack message sent to ${channel}`);
    return res.data;
  } catch (err) {
    logger.error('Slack sendMessage failed', err);
    throw err;
  }
}

/**
 * Post a formatted alert attachment to Slack.
 * @param {string} title
 * @param {string} message
 * @param {'red'|'yellow'|'green'} color
 */
export async function sendAlert(title, message, color = 'green') {
  const colorMap = { red: 'danger', yellow: 'warning', green: 'good' };
  const channel = process.env.SLACK_CHANNEL_ID;

  try {
    const res = await axios.post(
      `${SLACK_API}/chat.postMessage`,
      {
        channel,
        attachments: [
          {
            color: colorMap[color] ?? color,
            title,
            text: message,
            footer: 'Automation Engine',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      },
      { headers: authHeaders() }
    );
    if (!res.data.ok) throw new Error(res.data.error);
    logger.success(`Slack alert sent: ${title}`);
    return res.data;
  } catch (err) {
    logger.error('Slack sendAlert failed', err);
    throw err;
  }
}

/**
 * Send a formatted sports score card to Slack.
 * @param {{ homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, status: string, competition: string }} matchData
 */
export async function sendMatchUpdate(matchData) {
  const { homeTeam, awayTeam, homeScore, awayScore, status, competition } = matchData;
  const channel = process.env.SLACK_CHANNEL_ID;

  try {
    const res = await axios.post(
      `${SLACK_API}/chat.postMessage`,
      {
        channel,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `⚽ ${competition} — LIVE`, emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*${homeTeam}*\n${homeScore}` },
              { type: 'mrkdwn', text: `*${awayTeam}*\n${awayScore}` },
            ],
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `Status: *${status}* | ${new Date().toUTCString()}` }],
          },
        ],
      },
      { headers: authHeaders() }
    );
    if (!res.data.ok) throw new Error(res.data.error);
    logger.success(`Slack match update sent: ${homeTeam} vs ${awayTeam}`);
    return res.data;
  } catch (err) {
    logger.error('Slack sendMatchUpdate failed', err);
    throw err;
  }
}
