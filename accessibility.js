/* ============================================================
   JAL Accessibility Widget — self-injecting, drop-in.
   Include with a single <script src="accessibility.js"></script>
   at the end of <body> on any page. No other markup needed —
   this file injects its own button, sidebar, and styles, and
   persists settings in localStorage so they carry across pages.
   ============================================================ */
(function () {
  const STORAGE_KEY = 'jal-a11y-prefs-v2';
  const DEFAULTS = {
    highContrast: false, darkMode: false, grayscale: false, fontScale: 1,
    dyslexiaFont: false, textSpacing: false, readingGuide: false, lineHeight: 1.65,
    highlightLinks: false, focusIndicator: false, largeCursor: false, stopAnimations: false
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } }

  let prefs = load();

  const TOGGLES = [
    { key: 'highContrast', section: 'Vision', title: 'High Contrast', desc: 'Sharpen colour differences' },
    { key: 'darkMode', section: 'Vision', title: 'Dark Mode', desc: 'Invert page colours' },
    { key: 'grayscale', section: 'Vision', title: 'Grayscale', desc: 'Remove all colour' },
    { key: 'dyslexiaFont', section: 'Reading', title: 'Dyslexia Font', desc: 'Easier-to-read typeface' },
    { key: 'textSpacing', section: 'Reading', title: 'Text Spacing', desc: 'Increase letter & line spacing' },
    { key: 'readingGuide', section: 'Reading', title: 'Reading Guide', desc: 'Line follows your cursor' },
    { key: 'highlightLinks', section: 'Navigation', title: 'Highlight Links', desc: 'Make all links visible' },
    { key: 'focusIndicator', section: 'Navigation', title: 'Focus Indicator', desc: 'Bold keyboard focus ring' },
    { key: 'largeCursor', section: 'Navigation', title: 'Large Cursor', desc: 'Bigger mouse pointer' },
    { key: 'stopAnimations', section: 'Navigation', title: 'Stop Animations', desc: 'For motion sensitivity' }
  ];
  const STEPPERS = [
    { key: 'fontScale', section: 'Vision', title: 'Font Size', min: 0.8, max: 2.0, step: 0.1, fmt: v => Math.round(v * 100) + '%' },
    { key: 'lineHeight', section: 'Reading', title: 'Line Height', min: 1.2, max: 2.2, step: 0.05, fmt: v => v.toFixed(2) }
  ];
  const SECTIONS = ['Vision', 'Reading', 'Navigation'];

  const CURSOR_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 32 32'><path d='M4 2 L4 28 L11 21 L15 29 L19 27 L15 19 L24 19 Z' fill='black' stroke='white' stroke-width='2'/></svg>";
  const CURSOR_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(CURSOR_SVG);

  function injectBaseStyles() {
    if (document.getElementById('jal-a11y-style')) return;
    const style = document.createElement('style');
    style.id = 'jal-a11y-style';
    style.textContent = `
      @font-face { font-family: 'OpenDyslexic'; font-weight: 400; font-style: normal; font-display: swap;
        src: url('https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff2') format('woff2'); }

      #jal-a11y-root { font-family: 'DM Sans', sans-serif; }
      #jal-a11y-toggle-btn { position: fixed; left: 0; top: 50%; transform: translateY(-50%); z-index: 99998;
        width: 54px; height: 54px; border: none; border-radius: 0 16px 16px 0; background: #2f855a; color: #fff;
        display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 3px 4px 18px rgba(0,0,0,0.25);
        font-size: 24px; transition: width 0.2s ease, background 0.2s ease; }
      #jal-a11y-toggle-btn:hover { width: 60px; background: #f08f3f; }
      #jal-a11y-overlay { position: fixed; inset: 0; background: rgba(8,16,14,0.45); z-index: 99997; opacity: 0; visibility: hidden; transition: opacity 0.25s ease; }
      #jal-a11y-overlay.open { opacity: 1; visibility: visible; }
      #jal-a11y-panel { position: fixed; top: 0; left: 0; height: 100vh; width: min(380px, 92vw); background: #fff; color: #102a24;
        z-index: 99999; box-shadow: 6px 0 40px rgba(0,0,0,0.22); transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
        overflow-y: auto; display: flex; flex-direction: column; }
      #jal-a11y-panel.open { transform: translateX(0); }
      .jal-a11y-header { position: sticky; top: 0; background: #fff; display: flex; align-items: center; justify-content: space-between;
        padding: 1.1rem 1.25rem; border-bottom: 1px solid rgba(16,42,36,0.1); z-index: 2; }
      .jal-a11y-header h2 { margin: 0; font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: #102a24; }
      .jal-a11y-close { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #56615c; width: 36px; height: 36px; border-radius: 50%; }
      .jal-a11y-close:hover { background: rgba(16,42,36,0.08); }
      .jal-a11y-body { padding: 0.5rem 1.25rem 1.5rem; }
      .jal-a11y-section-title { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.72rem; font-weight: 800; color: #2f855a; margin: 1.3rem 0 0.6rem; }
      .jal-a11y-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.7rem 0; border-bottom: 1px solid rgba(16,42,36,0.06); }
      .jal-a11y-row-text { display: flex; flex-direction: column; }
      .jal-a11y-row-title { font-size: 0.88rem; font-weight: 700; color: #102a24; }
      .jal-a11y-row-desc { font-size: 0.76rem; color: #56615c; margin-top: 0.1rem; }
      .jal-a11y-row-state { font-size: 0.7rem; font-weight: 700; color: #56615c; margin-top: 0.15rem; }
      .jal-a11y-switch { position: relative; width: 44px; height: 26px; border-radius: 999px; border: none; background: #d8ddd8; cursor: pointer; flex-shrink: 0; transition: background 0.2s ease; }
      .jal-a11y-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
      .jal-a11y-switch[aria-pressed="true"] { background: #2f855a; }
      .jal-a11y-switch[aria-pressed="true"]::after { transform: translateX(18px); }
      .jal-a11y-stepper { display: flex; align-items: center; gap: 0.5rem; }
      .jal-a11y-step-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(16,42,36,0.15); background: #fff; cursor: pointer; font-weight: 800; }
      .jal-a11y-step-btn:hover { background: #2f855a; color: #fff; border-color: #2f855a; }
      .jal-a11y-step-value { min-width: 3.4rem; text-align: center; font-weight: 700; font-size: 0.82rem; color: #56615c; }
      .jal-a11y-reset { width: 100%; margin-top: 1.4rem; padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid rgba(16,42,36,0.15); background: #fbfcfa; cursor: pointer; font-weight: 700; font-size: 0.85rem; color: #102a24; }
      .jal-a11y-reset:hover { background: #f1f4f1; }
      .jal-a11y-voice-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.6rem; }
      .jal-a11y-voice-btn { flex: 1; min-width: 100px; padding: 0.6rem 0.8rem; border-radius: 10px; border: none; background: #2f855a; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
      .jal-a11y-voice-btn.secondary { background: #fff; border: 1px solid rgba(16,42,36,0.15); color: #102a24; }
      .jal-a11y-voice-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .jal-a11y-status { margin-top: 0.7rem; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(47,133,90,0.09); color: #2f855a; font-size: 0.78rem; font-weight: 600; min-height: 1.1em; }
      .jal-a11y-status:empty { display: none; }
      .jal-a11y-cmds { list-style: none; margin: 0.6rem 0 0; padding: 0; font-size: 0.74rem; color: #56615c; display: grid; gap: 0.3rem; }
      .jal-a11y-cmds code { background: #f1f4f1; color: #102a24; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700; }

      /* --- Effects applied to the whole page --- */
      html.a11y-contrast, html.a11y-contrast body { background: #000 !important; }
      html.a11y-contrast *:not(#jal-a11y-root):not(#jal-a11y-root *) { background-color: #000 !important; color: #fff !important; border-color: #fff !important; box-shadow: none !important; text-shadow: none !important; }
      html.a11y-contrast a:not(#jal-a11y-root a) { color: #ffd166 !important; text-decoration: underline !important; }
      html.a11y-contrast button:not(#jal-a11y-root button), html.a11y-contrast .button, html.a11y-contrast .lab-btn, html.a11y-contrast .buy-chip { color: #000 !important; background: #ffd166 !important; border: 2px solid #fff !important; }
      html.a11y-dyslexia-font *:not(#jal-a11y-root):not(#jal-a11y-root *) { font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important; }
      html.a11y-text-spacing *:not(#jal-a11y-root):not(#jal-a11y-root *) { letter-spacing: 0.12em !important; word-spacing: 0.18em !important; }
      html.a11y-highlight-links a:not(#jal-a11y-root a) { background: #fff59d !important; color: #102a24 !important; text-decoration: underline !important; border-radius: 3px; padding: 0 2px; }
      html.a11y-focus-indicator *:focus-visible { outline: 4px solid #ffbf00 !important; outline-offset: 3px !important; }
      html.a11y-large-cursor, html.a11y-large-cursor * { cursor: url("${CURSOR_URL}") 4 4, auto !important; }
      html.a11y-stop-animations, html.a11y-stop-animations * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
      html.a11y-stop-animations .reveal { opacity: 1 !important; transform: none !important; }
      html.a11y-line-height-active p:not(#jal-a11y-root p), html.a11y-line-height-active li:not(#jal-a11y-root li), html.a11y-line-height-active .section-copy { line-height: var(--a11y-line-height, 1.65) !important; }

      #jal-a11y-reading-guide { position: fixed; left: 0; right: 0; height: 3px; background: #f08f3f; box-shadow: 0 0 10px 2px rgba(240,143,63,0.7); pointer-events: none; z-index: 99996; display: none; }
      @media (max-width: 480px) { #jal-a11y-panel { width: 100vw; } }
    `;
    document.head.appendChild(style);
  }

  function buildRow(t) {
    const on = !!prefs[t.key];
    return `<div class="jal-a11y-row" data-row="${t.key}">
      <div class="jal-a11y-row-text">
        <span class="jal-a11y-row-title">${t.title}</span>
        <span class="jal-a11y-row-desc">${t.desc}</span>
        <span class="jal-a11y-row-state">${on ? 'On' : 'Off'}</span>
      </div>
      <button class="jal-a11y-switch" data-key="${t.key}" aria-pressed="${on}" aria-label="${t.title}"></button>
    </div>`;
  }
  function buildStepper(s) {
    return `<div class="jal-a11y-row" data-row="${s.key}">
      <div class="jal-a11y-row-text"><span class="jal-a11y-row-title">${s.title}</span></div>
      <div class="jal-a11y-stepper">
        <button class="jal-a11y-step-btn" data-step="${s.key}" data-dir="-1" aria-label="Decrease ${s.title}">−</button>
        <span class="jal-a11y-step-value" data-value="${s.key}">${s.fmt(prefs[s.key])}</span>
        <button class="jal-a11y-step-btn" data-step="${s.key}" data-dir="1" aria-label="Increase ${s.title}">+</button>
      </div>
    </div>`;
  }

  function buildPanelHTML() {
    let body = '';
    SECTIONS.forEach((sec) => {
      body += `<div class="jal-a11y-section-title">${sec}</div>`;
      TOGGLES.filter(t => t.section === sec).forEach(t => { body += buildRow(t); });
      STEPPERS.filter(s => s.section === sec).forEach(s => { body += buildStepper(s); });
    });
    body += `<button class="jal-a11y-reset" id="jal-a11y-reset">Reset all settings</button>`;
    body += `<div class="jal-a11y-section-title">Voice Assist</div>
      <div class="jal-a11y-row-desc" style="margin-bottom:0.3rem;">Have the page read to you, or move around the site hands-free.</div>
      <div class="jal-a11y-voice-row">
        <button class="jal-a11y-voice-btn" id="jal-a11y-read">🔊 Read page</button>
        <button class="jal-a11y-voice-btn secondary" id="jal-a11y-pause" disabled>⏸ Pause</button>
        <button class="jal-a11y-voice-btn secondary" id="jal-a11y-stop-read" disabled>■ Stop</button>
      </div>
      <div class="jal-a11y-voice-row">
        <button class="jal-a11y-voice-btn" id="jal-a11y-voice" aria-pressed="false">🎙️ Start listening</button>
      </div>
      <ul class="jal-a11y-cmds">
        <li><code>"read this page"</code> / <code>"stop reading"</code></li>
        <li><code>"high contrast on/off"</code>, <code>"dark mode on/off"</code></li>
        <li><code>"bigger text"</code> / <code>"smaller text"</code></li>
        <li><code>"open code lab / products / quote / account / contact"</code>, <code>"go home"</code></li>
        <li><code>"call us"</code></li>
      </ul>
      <div class="jal-a11y-status" id="jal-a11y-status" role="status" aria-live="polite"></div>`;
    return `
      <button id="jal-a11y-toggle-btn" aria-label="Open accessibility menu" aria-expanded="false" aria-controls="jal-a11y-panel">♿</button>
      <div id="jal-a11y-overlay"></div>
      <aside id="jal-a11y-panel" role="dialog" aria-label="Accessibility settings" aria-hidden="true">
        <div class="jal-a11y-header"><h2>Accessibility</h2><button class="jal-a11y-close" id="jal-a11y-close" aria-label="Close accessibility menu">✕</button></div>
        <div class="jal-a11y-body">${body}</div>
      </aside>
      <div id="jal-a11y-reading-guide"></div>`;
  }

  function applyFilters() {
    const parts = [];
    if (prefs.darkMode) parts.push('invert(1) hue-rotate(180deg)');
    if (prefs.grayscale) parts.push('grayscale(1)');
    document.documentElement.style.filter = parts.join(' ');
    let mediaStyle = document.getElementById('jal-a11y-media-style');
    if (!mediaStyle) {
      mediaStyle = document.createElement('style');
      mediaStyle.id = 'jal-a11y-media-style';
      document.head.appendChild(mediaStyle);
    }
    const mediaParts = [];
    if (prefs.darkMode) mediaParts.push('invert(1) hue-rotate(180deg)');
    if (prefs.grayscale) mediaParts.push('grayscale(1)');
    mediaStyle.textContent = mediaParts.length
      ? `img, video, picture, svg:not(#jal-a11y-root svg), canvas, iframe { filter: ${mediaParts.join(' ')} !important; }`
      : '';
  }

  function apply() {
    const html = document.documentElement;
    html.classList.toggle('a11y-contrast', !!prefs.highContrast);
    html.classList.toggle('a11y-dyslexia-font', !!prefs.dyslexiaFont);
    html.classList.toggle('a11y-text-spacing', !!prefs.textSpacing);
    html.classList.toggle('a11y-highlight-links', !!prefs.highlightLinks);
    html.classList.toggle('a11y-focus-indicator', !!prefs.focusIndicator);
    html.classList.toggle('a11y-large-cursor', !!prefs.largeCursor);
    html.classList.toggle('a11y-stop-animations', !!prefs.stopAnimations);
    html.classList.toggle('a11y-line-height-active', prefs.lineHeight !== DEFAULTS.lineHeight);
    html.style.setProperty('--a11y-line-height', prefs.lineHeight);
    html.style.fontSize = Math.round(prefs.fontScale * 100) + '%';
    applyFilters();
    toggleReadingGuide(!!prefs.readingGuide);
    syncPanelUI();
  }

  function syncPanelUI() {
    TOGGLES.forEach(t => {
      const btn = document.querySelector('#jal-a11y-panel .jal-a11y-switch[data-key="' + t.key + '"]');
      if (!btn) return;
      const on = !!prefs[t.key];
      btn.setAttribute('aria-pressed', String(on));
      const row = btn.closest('.jal-a11y-row');
      if (row) row.querySelector('.jal-a11y-row-state').textContent = on ? 'On' : 'Off';
    });
    STEPPERS.forEach(s => {
      const el = document.querySelector('#jal-a11y-panel [data-value="' + s.key + '"]');
      if (el) el.textContent = s.fmt(prefs[s.key]);
    });
  }

  // ---- Reading guide line ----
  let guideHandler = null;
  function toggleReadingGuide(on) {
    const el = document.getElementById('jal-a11y-reading-guide');
    if (!el) return;
    if (on) {
      el.style.display = 'block';
      guideHandler = (e) => { el.style.top = e.clientY + 'px'; };
      window.addEventListener('mousemove', guideHandler);
    } else {
      el.style.display = 'none';
      if (guideHandler) window.removeEventListener('mousemove', guideHandler);
      guideHandler = null;
    }
  }

  // ---- Text to speech ----
  function supportsSpeech() { return 'speechSynthesis' in window; }
  function getReadableText() {
    const clone = document.body.cloneNode(true);
    const widgetRoot = clone.querySelector('#jal-a11y-root');
    if (widgetRoot) widgetRoot.remove();
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function speak(text, onend) {
    if (!supportsSpeech() || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    if (onend) utter.onend = onend;
    window.speechSynthesis.speak(utter);
  }

  // ---- Voice commands ----
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  const COMMANDS = [
    { patterns: ['read this page', 'read the page', 'read page'], action: () => document.getElementById('jal-a11y-read').click() },
    { patterns: ['stop reading', 'stop'], action: () => document.getElementById('jal-a11y-stop-read').click() },
    { patterns: ['high contrast on'], action: () => setPref('highContrast', true) },
    { patterns: ['high contrast off'], action: () => setPref('highContrast', false) },
    { patterns: ['dark mode on'], action: () => setPref('darkMode', true) },
    { patterns: ['dark mode off'], action: () => setPref('darkMode', false) },
    { patterns: ['bigger text', 'increase text'], action: () => stepPref('fontScale', 1) },
    { patterns: ['smaller text', 'decrease text'], action: () => stepPref('fontScale', -1) },
    { patterns: ['go home', 'open home', 'homepage'], action: () => location.href = 'index.html' },
    { patterns: ['open code lab', 'code lab'], action: () => location.href = 'codelab.html' },
    { patterns: ['open products', 'products'], action: () => location.href = 'products.html' },
    { patterns: ['open quote', 'get a quote', 'get quote'], action: () => location.href = 'quote.html' },
    { patterns: ['open account', 'my account'], action: () => location.href = 'account.html' },
    { patterns: ['open contact', 'contact us'], action: () => location.href = 'contact.html' },
    { patterns: ['call us', 'phone us'], action: () => location.href = 'tel:+254114976187' }
  ];

  function setStatus(msg) { const el = document.getElementById('jal-a11y-status'); if (el) el.textContent = msg; }

  function setPref(key, val) { prefs[key] = val; save(prefs); apply(); }
  function stepPref(key, dir) {
    const conf = STEPPERS.find(s => s.key === key);
    if (!conf) return;
    let v = Math.round((prefs[key] + dir * conf.step) * 100) / 100;
    v = Math.max(conf.min, Math.min(conf.max, v));
    prefs[key] = v; save(prefs); apply();
  }
  function resetAll() { prefs = Object.assign({}, DEFAULTS); save(prefs); apply(); setStatus('All settings reset.'); }

  function wireEvents(root) {
    const toggleBtn = document.getElementById('jal-a11y-toggle-btn');
    const panel = document.getElementById('jal-a11y-panel');
    const overlay = document.getElementById('jal-a11y-overlay');
    const closeBtn = document.getElementById('jal-a11y-close');

    function openPanel() {
      panel.classList.add('open'); overlay.classList.add('open');
      panel.setAttribute('aria-hidden', 'false'); toggleBtn.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
      panel.classList.remove('open'); overlay.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true'); toggleBtn.setAttribute('aria-expanded', 'false');
    }
    toggleBtn.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

    root.querySelectorAll('.jal-a11y-switch').forEach(btn => {
      btn.addEventListener('click', () => setPref(btn.dataset.key, !prefs[btn.dataset.key]));
    });
    root.querySelectorAll('.jal-a11y-step-btn').forEach(btn => {
      btn.addEventListener('click', () => stepPref(btn.dataset.step, parseInt(btn.dataset.dir, 10)));
    });
    document.getElementById('jal-a11y-reset').addEventListener('click', resetAll);

    const readBtn = document.getElementById('jal-a11y-read');
    const pauseBtn = document.getElementById('jal-a11y-pause');
    const stopReadBtn = document.getElementById('jal-a11y-stop-read');
    let paused = false;
    readBtn.addEventListener('click', () => {
      if (!supportsSpeech()) { setStatus('Text-to-speech is not supported in this browser.'); return; }
      speak(getReadableText(), () => {
        readBtn.disabled = false; pauseBtn.disabled = true; stopReadBtn.disabled = true; paused = false; pauseBtn.textContent = '⏸ Pause';
      });
      readBtn.disabled = true; pauseBtn.disabled = false; stopReadBtn.disabled = false;
      setStatus('Reading the page aloud.');
    });
    pauseBtn.addEventListener('click', () => {
      if (!paused) { window.speechSynthesis.pause(); pauseBtn.textContent = '▶ Resume'; paused = true; setStatus('Paused.'); }
      else { window.speechSynthesis.resume(); pauseBtn.textContent = '⏸ Pause'; paused = false; setStatus('Resumed.'); }
    });
    stopReadBtn.addEventListener('click', () => {
      if (supportsSpeech()) window.speechSynthesis.cancel();
      readBtn.disabled = false; pauseBtn.disabled = true; stopReadBtn.disabled = true; paused = false; pauseBtn.textContent = '⏸ Pause';
      setStatus('Stopped reading.');
    });

    const voiceBtn = document.getElementById('jal-a11y-voice');
    let listening = false;
    if (!SpeechRecognitionImpl) { voiceBtn.disabled = true; voiceBtn.textContent = '🎙️ Voice not supported'; }
    voiceBtn.addEventListener('click', () => {
      if (!SpeechRecognitionImpl) return;
      if (!listening) {
        recognizer = new SpeechRecognitionImpl();
        recognizer.continuous = true; recognizer.interimResults = false; recognizer.lang = 'en-US';
        recognizer.onresult = (e) => {
          const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
          setStatus('Heard: "' + transcript + '"');
          const match = COMMANDS.find(c => c.patterns.some(p => transcript.includes(p)));
          if (match) match.action();
        };
        recognizer.onerror = (e) => { setStatus('Voice error — check microphone permission.'); };
        recognizer.start();
        listening = true; voiceBtn.setAttribute('aria-pressed', 'true'); voiceBtn.textContent = '🎙️ Listening… (click to stop)';
        setStatus('Voice commands on. Try "open code lab".');
      } else {
        if (recognizer) { try { recognizer.stop(); } catch (e) {} recognizer = null; }
        listening = false; voiceBtn.setAttribute('aria-pressed', 'false'); voiceBtn.textContent = '🎙️ Start listening';
        setStatus('Voice commands off.');
      }
    });
  }

  function init() {
    injectBaseStyles();
    const root = document.createElement('div');
    root.id = 'jal-a11y-root';
    root.innerHTML = buildPanelHTML();
    document.body.appendChild(root);
    wireEvents(root);
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
