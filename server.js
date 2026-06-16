<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  <meta name="apple-mobile-web-app-title" content="TrendAI" />
  <title>TrendAI</title>
  <link rel="manifest" href="manifest.json" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    :root {
      --black: #0a0a0a; --white: #ffffff; --gray-2: #1a1a1a; --gray-3: #2a2a2a;
      --gray-5: #888888; --gray-6: #cccccc; --accent: #ff2d55; --blue: #0a84ff; --green: #30d158;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    html, body { height: 100%; background: var(--black); color: var(--white); font-family: var(--font); overflow: hidden; }
    #app { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
    .topbar { padding: 52px 20px 16px; background: var(--black); flex-shrink: 0; }
    .topbar-title { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .topbar-title span { color: var(--accent); }
    .topbar-sub { font-size: 13px; color: var(--gray-5); margin-top: 2px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 80px; }
    .bottomnav { display: flex; background: rgba(10,10,10,0.95); border-top: 0.5px solid var(--gray-3); flex-shrink: 0; padding-bottom: env(safe-area-inset-bottom); }
    .nav-btn { flex: 1; padding: 12px 0 10px; background: none; border: none; color: var(--gray-5); font-size: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
    .nav-btn.active { color: var(--accent); }
    .nav-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .page { display: none; padding: 0 16px; }
    .page.active { display: block; }
    .search-wrap { padding: 0 0 16px; }
    .search-box { display: flex; gap: 10px; align-items: center; background: var(--gray-2); border-radius: 14px; padding: 0 16px; border: 0.5px solid var(--gray-3); }
    .search-box input { flex: 1; background: none; border: none; outline: none; color: var(--white); font-size: 15px; padding: 13px 0; }
    .search-box input::placeholder { color: var(--gray-5); }
    .search-box button { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 0; white-space: nowrap; }
    .section-title { font-size: 13px; font-weight: 600; color: var(--gray-5); text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 12px; }
    .metric-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
    .metric { background: var(--gray-2); border-radius: 14px; padding: 14px 12px; border: 0.5px solid var(--gray-3); }
    .metric-label { font-size: 11px; color: var(--gray-5); margin-bottom: 4px; }
    .metric-value { font-size: 20px; font-weight: 700; }
    .video-card { background: var(--gray-2); border-radius: 16px; margin-bottom: 10px; border: 0.5px solid var(--gray-3); overflow: hidden; }
    .video-card.selected { border: 2px solid var(--accent); }
    .video-preview-wrap { position: relative; width: 100%; background: var(--gray-3); cursor: pointer; }
    .video-thumb { width: 100%; max-height: 280px; object-fit: cover; display: block; }
    .video-play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 50px; height: 50px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.5); }
    .video-play-btn svg { width: 20px; height: 20px; margin-left: 3px; }
    .video-info { padding: 12px 14px; }
    .video-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .badge-fire { background: rgba(255,45,85,0.15); color: var(--accent); }
    .badge-viral { background: rgba(10,132,255,0.15); color: var(--blue); }
    .badge-up { background: rgba(48,209,88,0.15); color: var(--green); }
    .video-views { font-size: 12px; color: var(--gray-5); }
    .video-title { font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; }
    .video-meta { display: flex; gap: 14px; font-size: 12px; color: var(--gray-5); flex-wrap: wrap; }
    .viral-bar-wrap { margin-top: 10px; display: flex; align-items: center; gap: 8px; }
    .viral-bar { flex: 1; height: 3px; background: var(--gray-3); border-radius: 2px; overflow: hidden; }
    .viral-fill { height: 100%; border-radius: 2px; background: var(--accent); }
    .viral-score { font-size: 11px; color: var(--gray-5); white-space: nowrap; }
    .select-btn { width: calc(100% - 28px); margin: 0 14px 14px; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .empty { text-align: center; padding: 60px 20px; color: var(--gray-5); }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .empty p { font-size: 15px; line-height: 1.5; }
    .step { display: flex; gap: 14px; align-items: flex-start; padding: 14px; background: var(--gray-2); border-radius: 14px; margin-bottom: 10px; border: 0.5px solid var(--gray-3); }
    .step-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .step-icon.pending { background: var(--gray-3); color: var(--gray-5); }
    .step-icon.running { background: rgba(255,45,85,0.15); color: var(--accent); }
    .step-icon.done { background: rgba(48,209,88,0.15); color: var(--green); }
    .step-icon.error { background: rgba(255,45,85,0.15); color: var(--accent); }
    .step-body { flex: 1; min-width: 0; }
    .step-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .step-desc { font-size: 12px; color: var(--gray-5); line-height: 1.4; }
    .btn-main { width: 100%; padding: 16px; background: var(--accent); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; margin: 16px 0; }
    .btn-main:disabled { opacity: 0.4; }
    .result-block { background: var(--gray-2); border-radius: 14px; padding: 14px; margin-bottom: 10px; border: 0.5px solid var(--gray-3); }
    .result-block-label { font-size: 11px; color: var(--gray-5); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .result-block-text { font-size: 14px; line-height: 1.6; }
    audio { width: 100%; border-radius: 10px; margin-top: 6px; }
    .selected-banner { background: rgba(255,45,85,0.12); border: 0.5px solid rgba(255,45,85,0.3); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; }
    .selected-banner-label { font-size: 11px; color: var(--accent); margin-bottom: 4px; font-weight: 600; }
    .selected-banner-title { font-size: 14px; font-weight: 600; line-height: 1.4; }
    .selected-banner-meta { font-size: 12px; color: var(--gray-5); margin-top: 4px; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -3px; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .runway-box { background: var(--gray-3); border-radius: 10px; padding: 16px; margin-top: 6px; }
    .runway-prompt { font-family: monospace; font-size: 12px; background: var(--gray-2); padding: 10px; border-radius: 8px; margin: 8px 0 12px; word-break: break-word; color: var(--gray-6); line-height: 1.5; }
    .runway-copy-btn { width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px; }
    .runway-open-btn { display: block; width: 100%; padding: 12px; background: var(--gray-2); color: white; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; text-decoration: none; }
  </style>
</head>
<body>
<div id="app">
  <div class="topbar">
    <div class="topbar-title">Trend<span>AI</span></div>
    <div class="topbar-sub"><span class="status-dot"></span>APIs connectées</div>
  </div>
  <div class="content">
    <div class="page active" id="page-discover">
      <div class="search-wrap" style="padding-top:16px">
        <div class="search-box">
          <input type="text" id="keyword" placeholder="Mot-clé, hashtag..." />
          <button onclick="fetchTrends()">Analyser</button>
        </div>
      </div>
      <div class="metric-row">
        <div class="metric"><div class="metric-label">Analysées</div><div class="metric-value" id="m1">—</div></div>
        <div class="metric"><div class="metric-label">Pic vues</div><div class="metric-value" id="m2">—</div></div>
        <div class="metric"><div class="metric-label">Durée top</div><div class="metric-value" id="m3">—</div></div>
      </div>
      <div class="section-title">Vidéos virales</div>
      <div id="trends-list">
        <div class="empty"><div class="empty-icon">🔍</div><p>Lance une analyse pour voir ce qui buzz sur TikTok</p></div>
      </div>
    </div>

    <div class="page" id="page-recreate">
      <div id="recreate-empty" class="empty"><div class="empty-icon">🎬</div><p>Sélectionne d'abord une vidéo dans "Découvrir"</p></div>
      <div id="recreate-content" style="display:none;padding-top:16px">
        <div class="selected-banner">
          <div class="selected-banner-label">Vidéo sélectionnée</div>
          <div class="selected-banner-title" id="sel-title">—</div>
          <div class="selected-banner-meta" id="sel-meta">—</div>
        </div>
        <div class="section-title">Pipeline IA</div>
        <div>
          <div class="step"><div class="step-icon pending" id="si1">1</div><div class="step-body"><div class="step-name">Extraction du texte</div><div class="step-desc" id="sd1">AssemblyAI extrait chaque mot</div></div></div>
          <div class="step"><div class="step-icon pending" id="si2">2</div><div class="step-body"><div class="step-name">Analyse visuelle + style</div><div class="step-desc" id="sd2">GPT-4o analyse l'image + le concept</div></div></div>
          <div class="step"><div class="step-icon pending" id="si3">3</div><div class="step-body"><div class="step-name">Voix IA (OpenAI)</div><div class="step-desc" id="sd3">Même texte, nouvelle voix naturelle</div></div></div>
          <div class="step"><div class="step-icon pending" id="si4">4</div><div class="step-body"><div class="step-name">Prompt Runway prêt</div><div class="step-desc" id="sd4">Génère le visuel sur Runway</div></div></div>
        </div>
        <button class="btn-main" id="rec-btn" onclick="startRecreation()">Lancer la recréation IA</button>
      </div>
    </div>

    <div class="page" id="page-result">
      <div id="result-empty" class="empty"><div class="empty-icon">⏳</div><p>Lance d'abord une recréation</p></div>
      <div id="result-content" style="display:none;padding-top:16px">
        <div class="section-title">Ta vidéo recréée</div>
        <div class="result-block"><div class="result-block-label">Script original conservé</div><div class="result-block-text" id="r-script" style="font-style:italic"></div></div>
        <div class="result-block"><div class="result-block-label">Voix IA générée</div><div id="r-voice"></div></div>
        <div class="result-block">
          <div class="result-block-label">Visuel IA — génère sur Runway</div>
          <div id="r-video"></div>
        </div>
        <div class="result-block"><div class="result-block-label">Pourquoi ça cartonne</div><div class="result-block-text" id="r-analysis"></div></div>
      </div>
    </div>
  </div>

  <nav class="bottomnav">
    <button class="nav-btn active" onclick="goTo('discover',0)">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Découvrir
    </button>
    <button class="nav-btn" onclick="goTo('recreate',1)">
      <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Recréer
    </button>
    <button class="nav-btn" onclick="goTo('result',2)">
      <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Résultat
    </button>
  </nav>
</div>

<script>
const RAPIDAPI_KEY = "0c5e4db21fmsh59e7d051432f496p13b245jsn2dd35f240b58";
const ASSEMBLYAI_KEY = "386bc3106f464fa2a9615d733a9381f7";
const SERVER = "https://trendai-server-production.up.railway.app";
let selectedVideo = null;
let currentPrompt = '';

function goTo(page, idx) {
  document.querySelectorAll('video').forEach(v => v.pause());
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((b,i) => b.classList.toggle('active', i === idx));
  document.querySelector('.content').scrollTop = 0;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return Math.round(n/1e3) + 'K';
  return String(n);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchTrends() {
  const kw = document.getElementById('keyword').value.trim() || 'viral';
  const list = document.getElementById('trends-list');
  list.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><p>Analyse en cours...</p></div>';
  try {
    const res = await fetch(`https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=${encodeURIComponent(kw)}&region=fr&count=10&cursor=0&publish_time=1&sort_type=1`, {
      headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' }
    });
    const data = await res.json();
    const videos = data?.data?.videos || data?.data?.itemList || [];
    if (!videos.length) throw new Error('Aucun résultat');
    const maxV = Math.max(...videos.map(v => v.play_count || 0));
    const avgD = Math.round(videos.reduce((s,v) => s + (v.duration||30), 0) / videos.length);
    document.getElementById('m1').textContent = videos.length;
    document.getElementById('m2').textContent = fmt(maxV);
    document.getElementById('m3').textContent = avgD + 's';
    list.innerHTML = '';
    videos.forEach(v => {
      const title = (v.title || v.desc || 'Vidéo TikTok').slice(0,90);
      const views = v.play_count || 0;
      const likes = v.digg_count || 0;
      const shares = v.share_count || 0;
      const dur = v.duration || 30;
      const author = v.author?.nickname || 'creator';
      const score = Math.min(99, Math.round((views/(maxV||1))*100));
      const badgeClass = views>1e6?'badge-fire':views>5e5?'badge-viral':'badge-up';
      const badgeLabel = views>1e6?'🔥 Buzz absolu':views>5e5?'📈 Viral':'⬆ Montant';
      const thumb = v.cover || v.video?.cover || '';
      const playUrl = v.play || v.video?.playAddr || '';
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="video-preview-wrap" onclick="toggleVideo(this,'${playUrl}')">
          ${thumb?`<img src="${thumb}" class="video-thumb" alt="thumb" onerror="this.style.display='none'">`:
          '<div style="height:160px"></div>'}
          <div class="video-play-btn">
            <svg viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21"/></svg>
          </div>
        </div>
        <div class="video-info">
          <div class="video-top"><span class="badge ${badgeClass}">${badgeLabel}</span><span class="video-views">👁 ${fmt(views)}</span></div>
          <div class="video-title">${title}</div>
          <div class="video-meta"><span>@${author}</span><span>❤️ ${fmt(likes)}</span><span>↗ ${fmt(shares)}</span><span>⏱ ${dur}s</span></div>
          <div class="viral-bar-wrap"><div class="viral-bar"><div class="viral-fill" style="width:${score}%"></div></div><span class="viral-score">${score}/100</span></div>
        </div>
        <button class="select-btn" onclick="selectVideo(this.closest('.video-card'),${JSON.stringify(v).replace(/"/g,'&quot;')})">Recréer cette vidéo</button>`;
      list.appendChild(card);
    });
  } catch(e) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><p>Erreur: ${e.message}</p></div>`;
  }
}

function toggleVideo(wrap, url) {
  const existing = wrap.querySelector('video');
  if (existing) { existing.paused ? existing.play() : existing.pause(); return; }
  if (!url) return;
  const vid = document.createElement('video');
  vid.src = url; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
  vid.style.cssText = 'width:100%;max-height:280px;object-fit:cover;display:block;';
  const img = wrap.querySelector('img');
  const btn = wrap.querySelector('.video-play-btn');
  if (img) img.style.display = 'none';
  if (btn) btn.style.display = 'none';
  wrap.insertBefore(vid, wrap.firstChild);
}

function selectVideo(card, v) {
  document.querySelectorAll('.video-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedVideo = v;
  document.getElementById('sel-title').textContent = (v.title||v.desc||'Vidéo TikTok').slice(0,80);
  document.getElementById('sel-meta').textContent = `@${v.author?.nickname||'creator'} • ${fmt(v.play_count||0)} vues`;
  document.getElementById('recreate-empty').style.display = 'none';
  document.getElementById('recreate-content').style.display = 'block';
  [1,2,3,4].forEach(i => { const el = document.getElementById('si'+i); el.className='step-icon pending'; el.textContent=i; });
  goTo('recreate', 1);
}

function setStep(i, status, desc) {
  const el = document.getElementById('si'+i);
  el.className = 'step-icon ' + status;
  if (status==='running') el.innerHTML='<span class="spinner" style="width:14px;height:14px;margin:0;border-top-color:var(--accent)"></span>';
  else if (status==='done') el.textContent='✓';
  else if (status==='error') el.textContent='!';
  else el.textContent=i;
  if (desc) document.getElementById('sd'+i).textContent=desc;
}

async function startRecreation() {
  if (!selectedVideo) return;
  const btn = document.getElementById('rec-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Recréation en cours...';
  const playUrl = selectedVideo.play || selectedVideo.video?.playAddr || '';
  const title = selectedVideo.title || selectedVideo.desc || '';
  const author = selectedVideo.author?.nickname || 'creator';
  const cover = selectedVideo.cover || selectedVideo.video?.cover || '';

  try {
    setStep(1, 'running', 'Extraction du texte...');
    let transcript = '';
    if (playUrl) {
      try {
        const sr = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: { 'authorization': ASSEMBLYAI_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ audio_url: playUrl, language_code: 'fr' })
        });
        const sd = await sr.json();
        for (let a=0; a<15; a++) {
          await sleep(3000);
          const pr = await fetch(`https://api.assemblyai.com/v2/transcript/${sd.id}`, { headers: { 'authorization': ASSEMBLYAI_KEY } });
          const pd = await pr.json();
          if (pd.status==='completed') { transcript=pd.text||''; break; }
          if (pd.status==='error') break;
        }
      } catch(e) {}
    }
    if (!transcript) transcript = title;
    setStep(1, 'done', `"${transcript.slice(0,50)}..."`);

    setStep(2, 'running', 'Analyse visuelle avec GPT-4o...');
    const ar = await fetch(`${SERVER}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transcript, author, cover })
    });
    const analysis = await ar.json();
    if (analysis.error) throw new Error(analysis.error);
    currentPrompt = analysis.runway_prompt;
    setStep(2, 'done', analysis.style_visuel?.slice(0,60));

    setStep(3, 'running', 'Génération voix OpenAI...');
    let voiceUrl = null;
    try {
      const vr = await fetch(`${SERVER}/voice`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: transcript })
      });
      if (vr.ok) { const blob = await vr.blob(); voiceUrl = URL.createObjectURL(blob); }
    } catch(e) {}
    setStep(3, voiceUrl?'done':'done', voiceUrl?'Voix générée !':'Erreur voix');

    setStep(4, 'done', 'Prompt prêt — va dans Résultat');

    document.getElementById('result-empty').style.display = 'none';
    document.getElementById('result-content').style.display = 'block';
    document.getElementById('r-script').textContent = `"${transcript}"`;
    document.getElementById('r-analysis').textContent = analysis.analyse;

    const vd = document.getElementById('r-voice');
    vd.innerHTML = voiceUrl
      ? `<audio controls><source src="${voiceUrl}" type="audio/mpeg"></audio>`
      : `<p style="font-size:13px;color:var(--gray-5)">${analysis.voix_instructions}</p>`;

    document.getElementById('r-video').innerHTML = `
      <div class="runway-box">
        <p style="font-size:13px;color:var(--gray-5);margin-bottom:4px">Prompt généré par GPT-4o — fidèle au style original :</p>
        <div class="runway-prompt">${currentPrompt}</div>
        <button class="runway-copy-btn" onclick="navigator.clipboard.writeText(document.querySelector('.runway-prompt').textContent).then(()=>this.textContent='✓ Copié !')">Copier le prompt</button>
        <a class="runway-open-btn" href="https://app.runwayml.com" target="_blank">Ouvrir Runway →</a>
      </div>`;

    goTo('result', 2);
    btn.textContent = 'Relancer';
    btn.disabled = false;
  } catch(e) {
    setStep(2, 'error', 'Erreur: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Réessayer';
  }
}
</script>
</body>
</html>
