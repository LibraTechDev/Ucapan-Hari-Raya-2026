/* ============================================================
   envelope.js — envelope tap logic, screen nav, card reveal,
                 confetti burst, SVG petal rain
   ============================================================ */

// ── Screen navigation ────────────────────────────────────────
function go(from, to) {
  const sf = document.getElementById('s' + from);
  const st = document.getElementById('s' + to);
  sf.classList.add('out');
  setTimeout(() => {
    sf.classList.remove('active', 'out');
    st.classList.add('active');
    if (to === 1) resetEnv();
  }, 500);
}

// ── Show card: GPU scale-expand from letter's screen center ──
function showCard() {
  const elit   = document.getElementById('elit');
  const overlay = document.getElementById('cardOverlay');
  const wrap   = document.getElementById('cardWrap');

  const r  = elit.getBoundingClientRect();
  const ox = ((r.left + r.width  / 2) / window.innerWidth  * 100).toFixed(1) + '%';
  const oy = ((r.top  + r.height / 2) / window.innerHeight * 100).toFixed(1) + '%';
  wrap.style.transformOrigin = ox + ' ' + oy;

  overlay.classList.add('visible');
  dropPetals();
  musicOnCardOpen(); // 🎵 start music when card opens
}

// ── Replay: scale card back out then go to screen 1 ──────────
function replayAll() {
  const overlay = document.getElementById('cardOverlay');
  const wrap    = document.getElementById('cardWrap');

  wrap.style.transition    = 'transform .32s cubic-bezier(.4,0,.8,1), opacity .22s ease';
  overlay.style.transition = 'background .32s ease';
  overlay.classList.remove('visible');
  musicOnReplay(); // 🔇 stop music on replay

  setTimeout(() => {
    wrap.style.transition    = '';
    overlay.style.transition = '';
    const s2 = document.getElementById('s2');
    s2.classList.add('out');
    setTimeout(() => {
      s2.classList.remove('active', 'out');
      document.getElementById('s1').classList.add('active');
      resetEnv();
    }, 500);
  }, 380);
}

// ── Envelope state ───────────────────────────────────────────
let taps = 0, opened = false;

function calcLetterRise() {
  const elit  = document.getElementById('elit');
  const ew    = document.getElementById('ew');
  const eRect = ew.getBoundingClientRect();
  const elRect = elit.getBoundingClientRect();
  const target = Math.max(70, eRect.top - elRect.height * 0.42);
  return elRect.top - target;
}

function tapEnv() {
  if (opened) return;
  taps++;
  const stage = document.getElementById('stage');
  const ew    = document.getElementById('ew');

  if (taps === 1) {
    // First tap: shake + gold glow hint
    stage.classList.add('shk');
    ew.style.filter = 'drop-shadow(0 16px 40px rgba(196,92,116,.35)) drop-shadow(0 0 18px rgba(212,168,83,.55))';
    document.getElementById('s2ht').textContent = '✦ Sekali lagi untuk membuka ✦';
    setTimeout(() => {
      stage.classList.remove('shk');
      ew.style.filter = 'drop-shadow(0 16px 40px rgba(196,92,116,.35))';
    }, 440);
    return;
  }

  // Second tap: open!
  opened = true;
  document.getElementById('s2ht').classList.add('gone');

  const elit = document.getElementById('elit');
  // Calculate rise while layout is stable (before collapsing s2tp)
  const rise = calcLetterRise();
  document.getElementById('s2tp').classList.add('gone');

  const FLAP = 520, RISE = 580;

  // Step 1: flip flap (CSS transition)
  stage.classList.add('opened');

  // Step 2: after flap opens — letter rises, envelope fades, card expands
  setTimeout(() => {
    elit.style.transition = `transform ${RISE}ms cubic-bezier(.25,1.3,.5,1), opacity .28s ease`;
    elit.style.transform  = `translateY(-${rise}px)`;
    elit.style.opacity    = '1';
    elit.style.zIndex     = '10';

    ew.style.transition = 'transform .5s ease, opacity .5s ease';
    ew.style.transform  = 'translateY(18px)';
    ew.style.opacity    = '0.3';

    confetti(stage);
    setTimeout(showCard, RISE); // fires exactly when rise animation ends
  }, FLAP);
}

function resetEnv() {
  taps = 0; opened = false;
  const stage = document.getElementById('stage');
  const elit  = document.getElementById('elit');
  const ew    = document.getElementById('ew');

  elit.style.cssText = 'transition:none;transform:translateY(50%);opacity:0;z-index:1';
  ew.style.cssText   = 'transition:none;transform:none;opacity:1;filter:drop-shadow(0 16px 40px rgba(196,92,116,.35))';
  stage.classList.remove('opened', 'shk');

  requestAnimationFrame(() => {
    elit.style.transition = '';
    ew.style.transition   = '';
  });

  document.getElementById('s2ht').classList.remove('gone');
  document.getElementById('s2tp').classList.remove('gone');
}

// ── Confetti burst (GPU-only, reduced for perf) ──────────────
function confetti(ref) {
  const r    = ref.getBoundingClientRect();
  const cx   = r.left + r.width  / 2;
  const cy   = r.top  + r.height / 2;
  const cols = ['#f9c5d1','#d4a853','#e8879c','#f9e080','#8db87a','#f0d090','#fde8ee','#c45c74'];

  for (let i = 0; i < 30; i++) {
    const p    = document.createElement('div');
    const ang  = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 140;
    const s    = 5  + Math.random() * 8;
    const dur  = .9 + Math.random() * .7;

    p.style.cssText = [
      'position:fixed', 'z-index:200', 'pointer-events:none', 'will-change:transform',
      `left:${cx}px`, `top:${cy}px`,
      `width:${s}px`, `height:${s}px`,
      `background:${cols[~~(Math.random() * cols.length)]}`,
      `border-radius:${Math.random() > .4 ? '50%' : '2px'}`,
      `animation:cfy ${dur}s ease-out forwards`,
      `animation-delay:${Math.random() * .15}s`,
      `--cx:${Math.cos(ang) * dist}px`,
      `--cy:${Math.sin(ang) * dist - 60}px`,
    ].join(';');

    document.body.appendChild(p);
    setTimeout(() => p.remove(), (dur + .3) * 1000);
  }
}

// ── Pink SVG petal shower (fires when card opens) ────────────
function dropPetals() {
  const rain = document.getElementById('petalRain');
  rain.innerHTML = '';

  const shapes = [
    (c, r) => `<svg width="${r*2}"   height="${r*2.8}" viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg"><ellipse cx="10" cy="14" rx="7" ry="12" fill="${c}" opacity=".82"/></svg>`,
    (c, r) => `<svg width="${r*2.2}" height="${r*2.2}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="11" rx="9"  ry="9"  fill="${c}" opacity=".75"/></svg>`,
    (c, r) => `<svg width="${r*2}"   height="${r*2.4}" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 22 C4 16,1 10,4 5 Q7 0 10 4 Q13 0 16 5 C19 10,16 16,10 22Z" fill="${c}" opacity=".78"/></svg>`,
  ];

  const pinkShades = [
    '#f9c5d1','#f5adc0','#f7b8ca','#fad4df',
    '#f2a0b8','#fce4ee','#e8879c','#f8d0dc',
    '#fbb6c8','#f4c0d0',
  ];

  const COUNT = 38, WAVE = 3;

  for (let i = 0; i < COUNT; i++) {
    const p      = document.createElement('div');
    p.className  = 'pr';
    const col    = pinkShades[~~(Math.random() * pinkShades.length)];
    const r      = 6 + Math.random() * 10;
    const shape  = shapes[~~(Math.random() * shapes.length)];
    const dur    = 2.8 + Math.random() * 2.4;
    const wave   = i % WAVE;
    const delay  = wave * 0.45 + Math.random() * 0.6;
    const left   = 2 + Math.random() * 96;
    const driftX = (Math.random() - 0.5) * 80;

    p.innerHTML = shape(col, r);
    p.style.cssText = `left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s;--dx:${driftX}px`;
    p.querySelector('svg').style.transform = `rotate(${Math.random() * 360}deg)`;

    rain.appendChild(p);
    setTimeout(() => { if (p.parentNode) p.remove(); }, (dur + delay + 0.5) * 1000);
  }

  const totalMs = (2.8 + 2.4 + 0.45 * WAVE + 0.6 + 1.0) * 1000;
  setTimeout(() => { rain.innerHTML = ''; }, totalMs);
}

// ── Share ────────────────────────────────────────────────────
async function shareIt() {
  const txt = [
    '🌙 Untuk Pelangi Laila Santoso 🌸',
    '',
    'Selamat Hari Raya Idul Fitri 1446 H',
    'Minal Aidzin Wal Faidzin',
    'Mohon Maaf Lahir & Batin 🙏',
    '',
    'Semoga hatimu secerah namamu —',
    'seindah pelangi setelah hujan. 🌈',
    '',
    'Taqabbalallahu minna wa minkum,',
    'shiyamana wa shiyamakum.',
    '',
    '❁  1 Syawal 1446 H  ❁',
  ].join('\n');

  if (navigator.share) {
    try { await navigator.share({ title: 'Selamat Idul Fitri', text: txt }); } catch (e) {}
  } else {
    try { await navigator.clipboard.writeText(txt); showToast('✓ Pesan disalin!'); }
    catch (e) { showToast('Salin teks dari kartu 🌸'); }
  }
}

// ── Toast helper ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2800);
}
