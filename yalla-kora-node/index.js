import express from 'express';

const app  = express();
const PORT = process.env.PORT || 3000;
const KEY  = process.env.APISPORTS_KEY || '60b1062cf3a1814fa45b70eb155a3316';

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widgets.api-sports.io https://v3.football.api-sports.io; " +
    "style-src 'self' 'unsafe-inline' https://widgets.api-sports.io; " +
    "img-src 'self' data: blob: https://widgets.api-sports.io https://media.api-sports.io https://media-3.api-sports.io; " +
    "connect-src 'self' https://v3.football.api-sports.io https://widgets.api-sports.io; " +
    "font-src 'self' data: https://widgets.api-sports.io; " +
    "frame-src 'self' https://widgets.api-sports.io;"
  );
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>يلا كورة لايف - مباريات كأس العالم 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0d0d0d;
      color: #f0f0f0;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
    }

    header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e94560;
    }

    .site-logo { font-size: 1.8rem; font-weight: 900; color: #e94560; }
    .site-tagline { font-size: 0.85rem; color: #aaa; margin-top: 2px; }

    nav { display: flex; gap: 20px; }
    nav a { color: #ccc; text-decoration: none; font-size: 0.9rem; }
    nav a:hover { color: #e94560; }

    .hero-banner {
      background: linear-gradient(180deg, #0f3460 0%, #0d0d0d 100%);
      text-align: center;
      padding: 40px 20px 30px;
    }
    .hero-banner h1 { font-size: 2rem; color: #fff; margin-bottom: 8px; }
    .hero-banner h1 span { color: #e94560; }
    .hero-banner p { color: #aaa; font-size: 0.95rem; }

    .main-content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      border-right: 4px solid #e94560;
      padding-right: 12px;
      margin-bottom: 20px;
    }

    .results-section {
      background: #141414;
      border-radius: 10px;
      padding: 24px;
      border: 1px solid #222;
    }

    .widget-wrapper { width: 100%; min-height: 400px; }

    #loading-msg {
      color: #555;
      text-align: center;
      padding: 60px 0;
      font-size: 0.95rem;
    }

    footer {
      text-align: center;
      padding: 20px;
      color: #555;
      font-size: 0.8rem;
      border-top: 1px solid #1a1a1a;
    }
  </style>
</head>
<body>

<header>
  <div>
    <div class="site-logo">يلا كورة لايف</div>
    <div class="site-tagline">مباريات مباشرة - نتائج - جداول</div>
  </div>
  <nav>
    <a href="#">الرئيسية</a>
    <a href="#">المباريات</a>
    <a href="#">النتائج</a>
    <a href="#">الجداول</a>
  </nav>
</header>

<div class="hero-banner">
  <h1>كأس العالم <span>2026</span></h1>
  <p>تابع جميع مباريات كأس العالم مباشرة وفي الوقت الفعلي</p>
</div>

<div class="main-content">
  <section class="results-section" id="results">
    <h2 class="section-title">نتائج ومباريات كأس العالم 2026</h2>
    <div class="widget-wrapper" id="widget-container">
      <p id="loading-msg">جاري تحميل المباريات...</p>
    </div>
  </section>
</div>

<footer>
  <p>يلا كورة لايف &copy; 2026 - جميع الحقوق محفوظة</p>
</footer>

<script>
  const _wk = '${KEY}';
  const _wd = new Date().toISOString().split('T')[0];

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('widget-container');
    document.getElementById('loading-msg').remove();

    const div = document.createElement('div');
    div.id = 'wg-api-football-games';
    div.setAttribute('data-host',    'v3.football.api-sports.io');
    div.setAttribute('data-key',     _wk);
    div.setAttribute('data-date',    _wd);
    div.setAttribute('data-league',  '1');
    div.setAttribute('data-season',  '2026');
    div.setAttribute('data-theme',   'dark');
    div.setAttribute('data-refresh', '15');
    container.appendChild(div);

    const config = document.createElement('api-sports-widget');
    config.setAttribute('data-type',        'config');
    config.setAttribute('data-key',         _wk);
    config.setAttribute('data-sport',       'football');
    config.setAttribute('data-lang',        'en');
    config.setAttribute('data-theme',       'dark');
    config.setAttribute('data-timezone',    'Asia/Doha');
    config.setAttribute('data-show-errors', 'true');
    config.setAttribute('data-show-logos',  'true');
    container.appendChild(config);

    const script = document.createElement('script');
    script.src  = 'https://widgets.api-sports.io/2.0.3/widgets.js';
    script.type = 'module';
    container.appendChild(script);
  });
</script>

</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`yalla-kora-live running on port ${PORT}`);
});
