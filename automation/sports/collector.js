import axios from 'axios';
import { logger } from '../utils/logger.js';

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

export async function fetchLiveMatches() {
  try {
    const { data } = await axios.get(ESPN_URL, { timeout: 10000 });
    const events = data.events || [];
    return events
      .filter(e => ['in', 'post'].includes(e.status?.type?.state))
      .map(e => {
        const comp = e.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === 'home');
        const away = comp?.competitors?.find(c => c.homeAway === 'away');
        return {
          matchId: e.id,
          homeTeam: home?.team?.displayName || 'Home',
          awayTeam: away?.team?.displayName || 'Away',
          homeScore: parseInt(home?.score || 0),
          awayScore: parseInt(away?.score || 0),
          status: e.status?.type?.description || 'Unknown',
          competition: e.name || 'FIFA World Cup 2026',
        };
      });
  } catch (err) {
    logger.error('ESPN fetchLiveMatches failed', err);
    return [];
  }
}
