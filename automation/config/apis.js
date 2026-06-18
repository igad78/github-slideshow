export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    channelId: process.env.SLACK_CHANNEL_ID,
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
  },
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    tableName: process.env.AIRTABLE_TABLE_NAME,
  },
  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
  },
  shopify: {
    storeUrl: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    channelId: process.env.YOUTUBE_CHANNEL_ID,
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
  },

  validate() {
    const checks = [
      { service: 'Claude AI',     key: 'ANTHROPIC_API_KEY',      value: this.anthropic.apiKey },
      { service: 'HubSpot',       key: 'HUBSPOT_API_KEY',         value: this.hubspot.apiKey },
      { service: 'Stripe Key',    key: 'STRIPE_SECRET_KEY',       value: this.stripe.secretKey },
      { service: 'Stripe WH',     key: 'STRIPE_WEBHOOK_SECRET',   value: this.stripe.webhookSecret },
      { service: 'Slack Token',   key: 'SLACK_BOT_TOKEN',         value: this.slack.botToken },
      { service: 'Slack Channel', key: 'SLACK_CHANNEL_ID',        value: this.slack.channelId },
      { service: 'Notion Key',    key: 'NOTION_API_KEY',          value: this.notion.apiKey },
      { service: 'Notion DB',     key: 'NOTION_DATABASE_ID',      value: this.notion.databaseId },
      { service: 'Airtable Key',  key: 'AIRTABLE_API_KEY',        value: this.airtable.apiKey },
      { service: 'Airtable Base', key: 'AIRTABLE_BASE_ID',        value: this.airtable.baseId },
      { service: 'Airtable Tbl',  key: 'AIRTABLE_TABLE_NAME',     value: this.airtable.tableName },
      { service: 'Gmail User',    key: 'GMAIL_USER',              value: this.gmail.user },
      { service: 'Gmail Pass',    key: 'GMAIL_APP_PASSWORD',      value: this.gmail.appPassword },
      { service: 'Shopify URL',   key: 'SHOPIFY_STORE_URL',       value: this.shopify.storeUrl },
      { service: 'Shopify Token', key: 'SHOPIFY_ACCESS_TOKEN',    value: this.shopify.accessToken },
      { service: 'ElevenLabs',    key: 'ELEVENLABS_API_KEY',      value: this.elevenlabs.apiKey },
      { service: 'EL Voice ID',   key: 'ELEVENLABS_VOICE_ID',     value: this.elevenlabs.voiceId },
      { service: 'TikTok',        key: 'TIKTOK_ACCESS_TOKEN',     value: this.tiktok.accessToken },
      { service: 'YouTube Key',   key: 'YOUTUBE_API_KEY',         value: this.youtube.apiKey },
      { service: 'YouTube Ch',    key: 'YOUTUBE_CHANNEL_ID',      value: this.youtube.channelId },
      { service: 'Instagram AT',  key: 'INSTAGRAM_ACCESS_TOKEN',  value: this.instagram.accessToken },
      { service: 'Instagram ID',  key: 'INSTAGRAM_ACCOUNT_ID',    value: this.instagram.accountId },
    ];

    const tableData = checks.map(({ service, key, value }) => ({
      Service: service,
      'Env Key': key,
      Status: value ? '✅ Present' : '⚠️  Missing',
    }));

    console.log('\n=== API Configuration Summary ===');
    console.table(tableData);

    const missing = checks.filter(c => !c.value);
    if (missing.length === 0) {
      console.log('All API keys configured.\n');
    } else {
      console.log(`${missing.length} key(s) missing — related features will be skipped.\n`);
    }

    return { present: checks.length - missing.length, missing: missing.length };
  },
};

export default config;
