import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a 3-sentence Arabic sports commentary script for a 30-second video.
 * @param {{ homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, event: string }} matchData
 * @returns {Promise<string>} Arabic script
 */
export async function generateArabicScript(matchData) {
  const { homeTeam, awayTeam, homeScore, awayScore, event } = matchData;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `أنت مذيع رياضي عربي محترف ومتحمس. اكتب تعليقاً رياضياً من 3 جمل باللغة العربية الفصحى لفيديو مدته 30 ثانية عن المباراة التالية:

الفريق المضيف: ${homeTeam}
الفريق الضيف: ${awayTeam}
النتيجة: ${homeScore} - ${awayScore}
الحدث: ${event}

المتطلبات:
- 3 جمل فقط، كل جملة لا تتجاوز 20 كلمة
- أسلوب حماسي وجذاب مناسب لمنصات التواصل الاجتماعي
- تضمين أسماء الفرق والنتيجة
- لا تضف أي نص إضافي أو شرح، فقط الجمل الثلاث`,
        },
      ],
    });

    const script = response.content[0]?.text?.trim() ?? '';
    logger.success(`Arabic script generated for ${homeTeam} vs ${awayTeam}`);
    return script;
  } catch (err) {
    logger.error('Failed to generate Arabic script', err);
    // Return a minimal fallback in Arabic
    return `مباراة مثيرة بين ${homeTeam} و${awayTeam}. النتيجة الحالية ${homeScore} - ${awayScore}. تابعوا معنا لمزيد من التحديثات.`;
  }
}

/**
 * Analyse a business event and return a structured action plan.
 * @param {string} eventType
 * @param {object} data
 * @returns {Promise<{summary: string, actions: Array<{platform: string, action: string, payload: object}>, priority: 'high'|'medium'|'low'}>}
 */
export async function processBusinessEvent(eventType, data) {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a business automation AI. Analyse the following event and return a JSON action plan.

Event Type: ${eventType}
Event Data: ${JSON.stringify(data, null, 2)}

Return ONLY valid JSON (no markdown, no explanation) with this exact shape:
{
  "summary": "One-sentence description of what happened and why it matters",
  "actions": [
    {
      "platform": "slack|notion|hubspot|airtable|gmail",
      "action": "what to do on this platform",
      "payload": { "key": "value" }
    }
  ],
  "priority": "high|medium|low"
}

Rules:
- priority is "high" if the event involves money > $1000, a new enterprise lead, or a system error
- priority is "medium" for regular leads, orders under $1000, routine updates
- priority is "low" for informational events
- suggest 1-3 actions across relevant platforms
- keep action descriptions concise and actionable`,
        },
      ],
    });

    const raw = response.content[0]?.text?.trim() ?? '{}';
    const plan = JSON.parse(raw);
    logger.success(`Action plan generated for event: ${eventType}`);
    return plan;
  } catch (err) {
    logger.error('Failed to process business event via Claude', err);
    return {
      summary: `Received ${eventType} event — manual review required`,
      actions: [{ platform: 'slack', action: 'Send alert about unprocessed event', payload: { eventType, data } }],
      priority: 'medium',
    };
  }
}
