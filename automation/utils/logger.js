const ts = () => new Date().toISOString().replace('T', ' ').split('.')[0];

export const logger = {
  info:    (msg)      => console.log(`ℹ️  [${ts()}] ${msg}`),
  success: (msg)      => console.log(`✅ [${ts()}] ${msg}`),
  error:   (msg, err) => console.error(`❌ [${ts()}] ${msg}`, err?.message || ''),
  warn:    (msg)      => console.warn(`⚠️  [${ts()}] ${msg}`),
  table:   (data)     => console.table(data),
};
