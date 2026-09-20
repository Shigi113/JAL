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
    .jal-shared-header { position:sticky; top:0; z-index:9000; background:rgba(255,253,249,.92); backdrop-filter:blur(14px); border-bottom:1px solid rgba(31,43,36,.12); font-family:'DM Sans',sans-serif; }
    .jal-header-inner { width:min(1240px,calc(100% - 32px)); min-height:78px; margin:auto; display:flex; align-items:center; gap:1.5rem; }
    .jal-brand { display:inline-flex; align-items:center; gap:.7rem; color:#1f2b24; text-decoration:none; flex-shrink:0; }
    .jal-brand img { width:44px; height:44px; object-fit:contain; transition:transform .2s ease; }
    .jal-brand:hover img { transform:scale(1.04) rotate(-2deg); }
    .jal-brand span { display:flex; flex-direction:column; line-height:1; }
    .jal-brand b { color:#1f6b4d; font:700 1.35rem 'Dancing Script',cursive; }
    .jal-brand small { margin-top:.28rem; color:#e79a42; font:800 .58rem 'Syne',sans-serif; letter-spacing:.14em; text-transform:uppercase; }
    #jal-navigation { margin-left:auto; }
    #jal-navigation ul { display:flex; align-items:center; justify-content:flex-end; gap:clamp(.65rem,1.4vw,1.25rem); list-style:none; margin:0; padding:0; }
    #jal-navigation a { position:relative; display:inline-flex; padding:.6rem 0; color:#4d5a54; text-decoration:none; font-size:.72rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; transition:color .2s ease,transform .2s ease; }
    #jal-navigation a::after { content:""; position:absolute; left:0; right:0; bottom:.18rem; height:2px; border-radius:99px; background:linear-gradient(90deg,#1f6b4d,#e79a42); transform:scaleX(0); transform-origin:center; transition:transform .2s ease; }
    #jal-navigation a:hover,#jal-navigation a:focus-visible,#jal-navigation a.active { color:#1f6b4d; transform:translateY(-1px); }
    #jal-navigation a:hover::after,#jal-navigation a:focus-visible::after,#jal-navigation a.active::after { transform:scaleX(1); }
    #jal-navigation a.quote { padding:.75rem 1rem; border-radius:999px; color:#fff; background:linear-gradient(135deg,#1f6b4d,#2e8d69); box-shadow:0 10px 22px rgba(31,107,77,.2); }
    #jal-navigation a.quote::after { display:none; }
    .jal-menu-button { display:none; margin-left:auto; border:0; background:transparent; color:#124733; font-size:1.55rem; cursor:pointer; padding:.5rem; }
    @media(max-width:980px){ .jal-menu-button{display:block} #jal-navigation{position:fixed; inset:78px 0 auto 0; padding:1rem 1.25rem 1.5rem; background:#fffdf9; border-bottom:1px solid rgba(31,43,36,.12); box-shadow:0 18px 30px rgba(18,35,29,.12); transform:translateY(-130%); transition:transform .25s ease;} #jal-navigation.open{transform:translateY(0)} #jal-navigation ul{display:grid; gap:.2rem; max-width:1240px; margin:auto;} #jal-navigation a{width:100%; padding:.75rem .25rem; font-size:.8rem;} #jal-navigation a.quote{text-align:center; justify-content:center; margin-top:.35rem;} }
    @media(prefers-reduced-motion:reduce){.jal-brand img,#jal-navigation a,#jal-navigation a::after,#jal-navigation{transition:none!important}}
    #jal-a11y-toggle { position:fixed; left:0; top:50%; z-index:99998; border:0; border-radius:0 14px 14px 0; padding:.8rem .7rem; color:#fff; background:#2f855a; cursor:pointer; font-size:1.25rem; box-shadow:3px 4px 18px rgba(0,0,0,.22); }
    #jal-a11y-panel { position:fixed; left:0; top:0; z-index:99999; width:min(340px,90vw); height:100vh; padding:1.25rem; overflow:auto; color:#102a24; background:#fff; box-shadow:6px 0 35px rgba(0,0,0,.22); transform:translateX(-105%); transition:transform .25s ease; }
    #jal-a11y-panel.open{transform:translateX(0)} #jal-a11y-panel h2{margin-top:0;font-family:Syne,sans-serif} #jal-a11y-panel button{margin:.25rem;padding:.55rem .7rem;border:1px solid #ccd6cf;border-radius:9px;background:#fff;cursor:pointer} #jal-a11y-panel button:hover{background:#eaf4ee} html.jal-high-contrast body{background:#000!important;color:#fff!important} html.jal-high-contrast a{color:#ffdc73!important;text-decoration:underline!important} html.jal-large-text{font-size:115%} html.jal-stop-motion *,html.jal-stop-motion *::before,html.jal-stop-motion *::after{animation:none!important;transition:none!important}
  `;
  document.head.appendChild(style);
  document.body.insertBefore(header, document.body.firstChild);

  if (current === 'arduino.html') {
    const link = document.createElement('a'); link.href = 'codelab.html'; link.textContent = 'Open Code Lab →';
    link.style.cssText = 'display:inline-flex;margin:1rem 1.5rem;padding:.8rem 1.1rem;border-radius:999px;background:#1f6b4d;color:#fff;font-weight:800;text-decoration:none;';
    header.after(link);
  }
  const menu = header.querySelector('.jal-menu-button'), navEl = header.querySelector('#jal-navigation');
  menu.addEventListener('click', () => { const open = navEl.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? '×' : '☰'; });

  const toggle = document.createElement('button'); toggle.id = 'jal-a11y-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-label','Open accessibility controls'); toggle.textContent = '♿';
  const panel = document.createElement('aside'); panel.id = 'jal-a11y-panel'; panel.setAttribute('aria-label','Accessibility controls'); panel.innerHTML = `<h2>Accessibility</h2><p>Adjust this site for your needs.</p><button data-a11y="contrast">High contrast</button><button data-a11y="size">Larger text</button><button data-a11y="motion">Stop motion</button><button data-a11y="read">🔊 Read page</button><button data-a11y="close">Close</button>`;
  document.body.append(toggle,panel);
  toggle.onclick=()=>panel.classList.toggle('open'); panel.onclick=e=>{const action=e.target.dataset.a11y;if(action==='close')panel.classList.remove('open');if(action==='contrast')document.documentElement.classList.toggle('jal-high-contrast');if(action==='size')document.documentElement.classList.toggle('jal-large-text');if(action==='motion')document.documentElement.classList.toggle('jal-stop-motion');if(action==='read'&&'speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(document.body.innerText));}};
})();
