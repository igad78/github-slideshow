import { fetchLiveMatches } from './collector.js';
import { generateContent } from './generator.js';
import { generateVoice } from './voice.js';
import { postToTikTok, postToYouTube, postToInstagram } from './publisher.js';
import { sendMatchUpdate } from '../apis/slack.js';
import { logger } from '../utils/logger.js';

const seenMatchIds = new Set();

export async function runPipeline() {
  const summary = { processed: 0, skipped: 0, errors: [] };
  logger.info('Sports pipeline started');

  try {
    const matches = await fetchLiveMatches();

    for (const match of matches) {
      if (seenMatchIds.has(match.matchId)) { summary.skipped++; continue; }
      seenMatchIds.add(match.matchId);

      try {
        const { script, hashtags, title } = await generateContent(match);
        const caption = `${title}\n\n${hashtags.join(' ')}`;

        // Instant Slack notification
        await sendMatchUpdate(match);

        // Voice generation
        const voicePath = `./output/voice-${match.matchId}.mp3`;
        await generateVoice(script, voicePath);

        // Video step — integrate Remotion here
        logger.info(`Video creation step — integrate Remotion for match ${match.matchId}`);
        const videoPath = voicePath; // placeholder until Remotion is integrated

        // Publish to all platforms
        const results = await Promise.allSettled([
          postToTikTok(videoPath, caption),
          postToYouTube(videoPath, title, caption),
          postToInstagram(videoPath, caption),
        ]);

        results.forEach((r, i) => {
          const platform = ['TikTok', 'YouTube', 'Instagram'][i];
          if (r.status === 'rejected') summary.errors.push(`${platform}: ${r.reason}`);
          else logger.success(`${platform} published for match ${match.matchId}`);
        });

        summary.processed++;
      } catch (err) {
        logger.error(`Pipeline error for match ${match.matchId}`, err);
        summary.errors.push(`match-${match.matchId}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error('Pipeline top-level error', err);
    summary.errors.push(err.message);
  }

  logger.info(`Pipeline done — processed: ${summary.processed}, skipped: ${summary.skipped}, errors: ${summary.errors.length}`);
  return summary;
}
