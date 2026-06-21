import { generateArabicScript } from '../apis/claude.js';
import { logger } from '../utils/logger.js';

export async function generateContent(match) {
  try {
    const script = await generateArabicScript(match);
    const hashtags = [
      '#كأس_العالم', '#فيفا2026', '#WorldCup2026',
      `#${match.homeTeam.replace(/\s+/g, '')}`,
      `#${match.awayTeam.replace(/\s+/g, '')}`,
      '#كرة_القدم', '#مباشر',
    ];
    const title = `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam} | كأس العالم 2026`;
    logger.success(`Content generated for: ${title}`);
    return { script, hashtags, title };
  } catch (err) {
    logger.error('generateContent failed', err);
    return { script: '', hashtags: [], title: '' };
  }
}
