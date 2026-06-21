import axios from 'axios';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { config } from '../config/apis.js';
import { logger } from '../utils/logger.js';

export async function generateVoice(text, outputPath) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`,
      { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8 } },
      { headers: { 'xi-api-key': config.elevenlabs.apiKey, 'Content-Type': 'application/json' }, responseType: 'stream' }
    );
    await pipeline(response.data, createWriteStream(outputPath));
    logger.success(`Voice saved: ${outputPath}`);
    return outputPath;
  } catch (err) {
    logger.error('ElevenLabs generateVoice failed', err);
    return null;
  }
}
