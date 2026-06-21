import axios from 'axios';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import { config } from '../config/apis.js';
import { logger } from '../utils/logger.js';

export async function postToTikTok(videoPath, caption) {
  try {
    const form = new FormData();
    form.append('video', createReadStream(videoPath));
    form.append('caption', caption);
    const { data } = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      form,
      { headers: { ...form.getHeaders(), Authorization: `Bearer ${config.tiktok.accessToken}` } }
    );
    logger.success(`TikTok posted: ${data.data?.publish_id || 'ok'}`);
    return data;
  } catch (err) {
    logger.error('TikTok postToTikTok failed', err);
  }
}

export async function postToYouTube(videoPath, title, description) {
  try {
    const form = new FormData();
    form.append('snippet', JSON.stringify({ title, description, categoryId: '17', defaultLanguage: 'ar' }));
    form.append('status', JSON.stringify({ privacyStatus: 'public' }));
    form.append('video', createReadStream(videoPath));
    const { data } = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
      form,
      { headers: { ...form.getHeaders(), Authorization: `Bearer ${config.youtube.apiKey}` } }
    );
    logger.success(`YouTube uploaded: ${data.id}`);
    return data;
  } catch (err) {
    logger.error('YouTube postToYouTube failed', err);
  }
}

export async function postToInstagram(videoPath, caption) {
  try {
    // Step 1: Create container
    const { data: container } = await axios.post(
      `https://graph.facebook.com/v19.0/${config.instagram.accountId}/media`,
      { video_url: videoPath, caption, media_type: 'REELS', access_token: config.instagram.accessToken }
    );
    // Step 2: Publish
    const { data: publish } = await axios.post(
      `https://graph.facebook.com/v19.0/${config.instagram.accountId}/media_publish`,
      { creation_id: container.id, access_token: config.instagram.accessToken }
    );
    logger.success(`Instagram published: ${publish.id}`);
    return publish;
  } catch (err) {
    logger.error('Instagram postToInstagram failed', err);
  }
}
