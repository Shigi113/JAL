/* JAL shared accessibility controls and unified site header. */
(function () {
  const nav = [
    ['Our Story', 'index.html'], ['Products', 'products.html'], ['Services', 'services.html'],
    ['Arduino', 'arduino.html'], ['Projects', 'projects.html'], ['Team', 'team.html'],
    ['Insights', 'insights.html'], ['Get Quote', 'quote.html'], ['Contacts', 'contact.html']
  ];
  const current = location.pathname.split('/').pop() || 'index.html';
  const header = document.createElement('header');
  header.className = 'jal-shared-header';
  header.innerHTML = `<div class="jal-header-inner">
    <a class="jal-brand" href="index.html" aria-label="Jengalabs Afritech home">
      <img src="jal-logo.png" alt="Jengalabs Afritech Limited logo">
      <span><b>Jengalabs</b><small>Afritech Limited</small></span>
    </a>
    <button class="jal-menu-button" type="button" aria-expanded="false" aria-controls="jal-navigation" aria-label="Open navigation">☰</button>
    <nav id="jal-navigation" aria-label="Main navigation"><ul>${nav.map(([label, href]) => `<li><a href="${href}" class="${href === current ? 'active' : ''}${href === 'quote.html' ? ' quote' : ''}">${label}</a></li>`).join('')}</ul></nav>
  </div>`;
  const style = document.createElement('style');
  style.textContent = `
    .topnav, header.topnav { display:none !important; }
    .jal-shared-header { position:sticky; top:0; z-index:9000; background:rgba(255,253,249,.94); backdrop-filter:blur(16px); border-bottom:1px solid rgba(31,43,36,.1); font-family:'DM Sans',sans-serif; }
    .jal-header-inner { width:min(1240px,calc(100% - 32px)); min-height:74px; margin:auto; display:flex; align-items:center; gap:1rem; }
    .jal-brand { display:inline-flex; align-items:center; gap:.65rem; color:#1f2b24; text-decoration:none; flex-shrink:0; }
    .jal-brand img { width:52px; height:52px; object-fit:contain; transition:transform .2s ease; }
    .jal-brand:hover img { transform:scale(1.035) rotate(-1deg); }
    .jal-brand span { display:flex; flex-direction:column; line-height:1; }
    .jal-brand b { color:#1f6b4d; font:700 1.42rem 'Dancing Script',cursive; }
    .jal-brand small { margin-top:.24rem; color:#e79a42; font:800 .56rem 'Syne',sans-serif; letter-spacing:.13em; text-transform:uppercase; }
    #jal-navigation { margin-left:auto; }
    #jal-navigation ul { display:flex; align-items:center; justify-content:flex-end; gap:clamp(.55rem,1.05vw,1rem); list-style:none; margin:0; padding:0; }
    #jal-navigation a { position:relative; display:inline-flex; padding:.48rem 0; color:#4d5a54; text-decoration:none; font-size:.7rem; font-weight:800; letter-spacing:.075em; text-transform:uppercase; transition:color .2s ease; }
    #jal-navigation a::after { content:""; position:absolute; left:18%; right:18%; bottom:.14rem; height:2px; border-radius:99px; background:#e79a42; opacity:0; transform:scaleX(.35); transition:opacity .2s ease,transform .2s ease; }
    #jal-navigation a:hover,#jal-navigation a:focus-visible,#jal-navigation a.active { color:#1f6b4d; }
    #jal-navigation a:hover::after,#jal-navigation a:focus-visible::after,#jal-navigation a.active::after { opacity:1; transform:scaleX(1); }
    #jal-navigation a.quote { padding:.68rem .92rem; border-radius:999px; color:#fff; background:linear-gradient(135deg,#1f6b4d,#2e8d69); box-shadow:0 8px 18px rgba(31,107,77,.18); }
    #jal-navigation a.quote::after { display:none; }
    .jal-menu-button { display:none; margin-left:auto; border:0; background:transparent; color:#124733; font-size:1.5rem; cursor:pointer; padding:.45rem; }
    .jal-codelab-link { display:inline-flex; margin:1.25rem 1.5rem; padding:.8rem 1.1rem; border-radius:999px; background:#1f6b4d; color:#fff; font-weight:800; text-decoration:none; }
    @media(max-width:980px){ .jal-menu-button{display:block} #jal-navigation{position:fixed; inset:74px 0 auto 0; padding:.8rem 1.25rem 1.3rem; background:#fffdf9; border-bottom:1px solid rgba(31,43,36,.1); box-shadow:0 18px 30px rgba(18,35,29,.1); transform:translateY(-130%); transition:transform .25s ease;} #jal-navigation.open{transform:translateY(0)} #jal-navigation ul{display:grid; gap:.1rem; max-width:1240px; margin:auto;} #jal-navigation a{width:100%; padding:.7rem .25rem; font-size:.78rem;} #jal-navigation a.quote{text-align:center; justify-content:center; margin-top:.35rem;} }
    @media(prefers-reduced-motion:reduce){.jal-brand img,#jal-navigation a,#jal-navigation a::after,#jal-navigation{transition:none!important}}
    #jal-whatsapp { position:fixed; right:1.25rem; bottom:1.25rem; z-index:9500; width:3.65rem; height:3.65rem; display:grid; place-items:center; border-radius:50%; color:#fff; background:#25d366; box-shadow:0 10px 25px rgba(37,211,102,.3); transition:transform .2s ease,box-shadow .2s ease; }
    #jal-whatsapp:hover,#jal-whatsapp:focus-visible { transform:translateY(-3px) scale(1.04); box-shadow:0 16px 32px rgba(37,211,102,.4); }
    #jal-whatsapp svg { width:1.75rem; height:1.75rem; fill:currentColor; }
    #jal-a11y-toggle { position:fixed; left:0; top:50%; z-index:99998; border:0; border-radius:0 14px 14px 0; padding:.8rem .7rem; color:#fff; background:#2f855a; cursor:pointer; font-size:1.25rem; box-shadow:3px 4px 18px rgba(0,0,0,.22); }
    #jal-a11y-panel { position:fixed; left:0; top:0; z-index:99999; width:min(340px,90vw); height:100vh; padding:1.25rem; overflow:auto; color:#102a24; background:#fff; box-shadow:6px 0 35px rgba(0,0,0,.22); transform:translateX(-105%); transition:transform .25s ease; }
    #jal-a11y-panel.open{transform:translateX(0)} #jal-a11y-panel h2{margin-top:0;font-family:Syne,sans-serif} #jal-a11y-panel button{margin:.25rem;padding:.55rem .7rem;border:1px solid #ccd6cf;border-radius:9px;background:#fff;cursor:pointer} #jal-a11y-panel button:hover{background:#eaf4ee} html.jal-high-contrast body{background:#000!important;color:#fff!important} html.jal-high-contrast a{color:#ffdc73!important;text-decoration:underline!important} html.jal-large-text{font-size:115%} html.jal-stop-motion *,html.jal-stop-motion *::before,html.jal-stop-motion *::after{animation:none!important;transition:none!important}
  `;
  document.head.appendChild(style);
  document.body.insertBefore(header, document.body.firstChild);

  if (current === 'arduino.html') {
    const link = document.createElement('a'); link.className = 'jal-codelab-link'; link.href = 'codelab.html'; link.textContent = 'Open Code Lab →';
    header.after(link);
  }
  const menu = header.querySelector('.jal-menu-button'), navEl = header.querySelector('#jal-navigation');
  menu.addEventListener('click', () => { const open = navEl.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); menu.textContent = open ? '×' : '☰'; });

  if (current === 'index.html' && !document.getElementById('jal-whatsapp')) {
    const whatsapp = document.createElement('a');
    whatsapp.id = 'jal-whatsapp'; whatsapp.href = 'https://wa.me/254114976187?text=Hi%20Jenga%20Labs%20Afritech'; whatsapp.target = '_blank'; whatsapp.rel = 'noopener'; whatsapp.setAttribute('aria-label', 'Chat with Jengalabs Afritech on WhatsApp');
    whatsapp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12.03 0C5.45 0 .09 5.35.09 11.94c0 2.1.55 4.15 1.6 5.96L.02 24l6.25-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.58 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.18-3.48-8.39ZM12.04 21.8h-.01c-1.8 0-3.57-.49-5.11-1.42l-.37-.22-3.71.98.99-3.62-.24-.37a9.84 9.84 0 0 1-1.51-5.21C2.08 6.51 6.55 2.05 12.04 2.05c2.66 0 5.16 1.04 7.04 2.92A9.88 9.88 0 0 1 21.99 12c0 5.4-4.43 9.8-9.95 9.8Zm5.45-7.35c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-1.76-.88-2.91-1.57-4.07-3.56-.31-.54.31-.5.88-1.68.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.03 1.01-1.03 2.47s1.06 2.87 1.2 3.07c.15.2 2.09 3.2 5.07 4.49.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg>';
    document.body.appendChild(whatsapp);
  }

  const toggle = document.createElement('button'); toggle.id = 'jal-a11y-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-label','Open accessibility controls'); toggle.textContent = '♿';
  const panel = document.createElement('aside'); panel.id = 'jal-a11y-panel'; panel.setAttribute('aria-label','Accessibility controls'); panel.innerHTML = `<h2>Accessibility</h2><p>Adjust this site for your needs.</p><button data-a11y="contrast">High contrast</button><button data-a11y="size">Larger text</button><button data-a11y="motion">Stop motion</button><button data-a11y="read">🔊 Read page</button><button data-a11y="close">Close</button>`;
  document.body.append(toggle,panel);
  toggle.onclick=()=>panel.classList.toggle('open'); panel.onclick=e=>{const action=e.target.dataset.a11y;if(action==='close')panel.classList.remove('open');if(action==='contrast')document.documentElement.classList.toggle('jal-high-contrast');if(action==='size')document.documentElement.classList.toggle('jal-large-text');if(action==='motion')document.documentElement.classList.toggle('jal-stop-motion');if(action==='read'&&'speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(document.body.innerText));}};
})();
