// Datelines, playable. Clicking a city opens its side-on scene: the art's own
// background / main / foreground layers with shallow parallax, ambient life
// drawn in code, and a stand-in walker. The door you stand at pulses; enter it
// and the walker steps inside while an in-game text box tells that part of
// the resume. Coordinates are in the art's native 1672x941 space.
// Everything in the text boxes is also on the page as plain text.
(() => {
  const slots = document.querySelectorAll('[data-scene]');
  if (!slots.length || typeof HTMLDialogElement !== 'function') return;

  const SW = 1672, SH = 941, SPEED = 430, STEP_IN = 0.75;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;

  const SCENES = {
    houston: {
      name: 'Houston', accent: '#f2a855', feet: 742, min: 60, max: 1610, spawn: 300, fig: 12,
      layers: ['background', 'main', 'foreground'],
      life: { birds: { y: [40, 140], x: [650, 1350] }, leaves: { colors: ['#9bb04a', '#c9a63a', '#6f8a35'], x: [0, 560], y: [120, 260] } },
      doors: [
        { x: 1429, y: 460, w: 80, h: 253, card: 'desk' },
        { x: 891, y: 533, w: 80, h: 184, game: 'spreads' },
        { x: 540, y: 515, w: 82, h: 200, card: 'energy' }, // the cafe
      ],
    },
    'west-texas': {
      name: 'Lubbock', accent: '#f08a3c', feet: 740, min: 60, max: 1610, spawn: 560, fig: 12,
      layers: ['background', 'main', 'foreground'],
      life: { birds: { y: [60, 220], x: [600, 1500] }, dust: true, tumbleweed: { y: 752 }, leaves: { colors: ['#b9862f', '#8a7a2c'], x: [0, 700], y: [60, 250], rate: 0.5 } },
      doors: [
        { x: 169, y: 453, w: 98, h: 220, card: 'ttu' },
        { x: 873, y: 460, w: 104, h: 227, card: 'football' },
        { x: 1505, y: 440, w: 150, h: 253, card: 'workshop' }, // the barn's open bay
      ],
    },
    pittsburgh: {
      name: 'Pittsburgh', accent: '#f2c24a', feet: 745, min: 60, max: 1610, spawn: 640, fig: 9,
      layers: ['background', 'main', 'foreground'],
      life: { birds: { y: [20, 120], x: [300, 1000] }, sparkle: { y: [790, 935] }, leaves: { colors: ['#d9622b', '#e8a53a', '#b8341f'], x: [0, 450], y: [0, 300], also: [1300, 1672] } },
      doors: [
        { x: 960, y: 467, w: 80, h: 166, card: 'cmu' },
        { x: 1513, y: 460, w: 67, h: 160, card: 'comps' },
        { x: 187, y: 453, w: 60, h: 147, card: 'clock' },
      ],
    },
    'the-city': {
      name: 'Chicago', accent: '#7fd3c4', feet: 762, min: 120, max: 1560, spawn: 700, fig: 14,
      layers: ['background', 'recesses', 'main', 'foreground'],
      life: { rain: { ground: [715, 935] }, leaves: { colors: ['#c8692a', '#a8451f'], x: [0, 420], y: [0, 260], rate: 0.6, also: [1450, 1672] } },
      doors: [
        { x: 1360, y: 413, w: 100, h: 280, card: 'book' },
        { x: 513, y: 387, w: 74, h: 306, card: 'stacks' },
        { x: 840, y: 427, w: 193, h: 273, card: 'next' },
      ],
    },
  };
  // Camera: every layer pans the same way, nearer ones further, like a camera
  // tracking the walker. Z enlarges the scene just enough that the pan never
  // shows an edge: (Z - 1) / 2 * SW >= PAN * the largest depth.
  const Z = 1.04, PAN = 22, DEPTH = { background: 0.35, recesses: 0.7, main: 1, foreground: 1.5 };

  // What each door says, page by page: [name tag, pages]. A page may end with
  // a link shown once its text has finished typing. This is the fun part of
  // the resume, not the resume: the paper above has the numbers.
  const TALK = {
    desk: ['THE GAS DESK', [
      'Summer 2026 was spent on a natural gas trading desk in Houston.',
      'The puzzle: how much gas is the country producing today, before anyone publishes it? Get that guess right early enough and you can trade on it.',
      'By the end of the summer, the pitch for a new desk had won capital for its first strategy.',
    ]],
    energy: ['THE ENERGY BOOK', [
      'Houston runs on energy, so this is where my own futures book lives: crude, natural gas and refined products, backtested since 2003.',
      'Carry, curve and trend across six markets. It earns its keep in crashes and gives some back in slow grinds.',
      "And no model I've tried forecasts tomorrow's oil price better than today's.",
    ]],
    ttu: ['TEXAS TECH', [
      'Lubbock is where it started: economics and math, with actuarial science, biology and chemistry along for the ride.',
      'Somewhere in there I took a Ph.D. stochastic calculus class and audited the Ph.D. high-frequency trading one, and the rest followed.',
    ]],
    football: ['COLLEGE FOOTBALL', [
      'College football is the hobby that turned into research.',
      'At Texas Tech I coauthored work on what name, image and likeness deals do to a roster. Now I model games against the betting market\'s closing line.',
      'Thirty-three ideas tested so far, and the market is still winning.',
    ]],
    workshop: ['THE WORKSHOP', [
      'The barn is where the side projects live.',
      'A turn-based grand-strategy game set in the Americas of 1836: you play on the map, the simulation plays on graphs.',
      'A tool that reads running form from a phone video, and a full pass through K&R\'s C book.',
    ]],
    cmu: ['CARNEGIE MELLON', [
      'Pittsburgh, for a master\'s in computational finance at Carnegie Mellon, through December 2026.',
      'Stochastic calculus, machine learning and options pricing, with a trading competition on the side.',
    ]],
    comps: ['THE SCOREBOARD', [
      'Three trading competitions so far.',
      'IMC Prosperity, where my market-making bots finished in the top 5% worldwide. The CMU MSCF competition, top 10 in volatility. And Jane Street\'s market-making competition.',
    ]],
    clock: ['OFF THE CLOCK', [
      'Off the clock: reading, traveling, and learning Arabic, somewhere between basic and intermediate.',
      'And college football, of course. See Lubbock.',
    ]],
    book: ['THE ORDER BOOK', [
      'Chicago is a trading town, so this is where the market-structure projects live.',
      'A matching engine in C that replays real Nasdaq days to the share, and a simulated order book where reinforcement-learning market makers try to earn their spread.',
    ]],
    stacks: ['THE STACKS', [
      'I co-wrote four textbook chapters on reading sentiment from text, and built a course linking it to asset prices.',
      ['This newspaper is the other thing I write.', 'Read the paper →', '#markets'],
    ]],
    next: ['NEXT STOP', [
      'Next stop: the SIG Predictions Cup, pricing markets on the 2026 midterm elections.',
      'After that, wherever the trains go. Thanks for walking through.',
    ]],
  };

  // ---------- 3x5 pixel font (the Spreads game uses it) ----------
  const GLYPHS = Object.fromEntries(Object.entries({
    A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
    E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
    I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
    M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
    Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
    U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
    Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
    0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
    4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.',
    8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.',
    $: '.## ##. .#. .## ##.', '+': '... .#. ### .#. ...', '-': '... ... ### ... ...', '.': '... ... ... ... .#.',
    ':': '... .#. ... .#. ...', '!': '.#. .#. .#. ... .#.', '/': '..# ..# .#. #.. #..', ',': '... ... ... .#. #..',
    "'": '.#. .#. ... ... ...', '&': '.#. #.# .#. #.# .##',
  }).map(([k, v]) => [k, v.replace(/ /g, '')]));
  const textWidth = (s, k) => (s.length * 4 - 1) * k;
  function pixelText(g, s, x, y, k, col) {
    g.fillStyle = col;
    [...s.toUpperCase()].forEach((ch, i) => {
      const f = GLYPHS[ch]; if (!f) return;
      for (let c = 0; c < 15; c++) if (f[c] === '#') g.fillRect(x + (i * 4 + (c % 3)) * k, y + ((c / 3) | 0) * k, k, k);
    });
  }

  // ---------- stand-in walker: a plain silhouette until real sprite art exists ----------
  const BODY = ['..###...', '.#####..', '.#####..', '.#####..', '..###...', '.#####..', '#######.', '#######.', '#.###.#.', '#.###.#.', '.#####..'];
  const LEGS = {
    idle: ['.##.##..', '.##.##..', '.##.##..', '.##.##..', '.##.##..'],
    a: ['.##.##..', '##...##.', '##...##.', '#.....#.', '#.....#.'],
    b: ['..###...', '..###...', '..##....', '..##....', '..##....'],
  };
  function figure(legs) {
    const c = document.createElement('canvas'); c.width = 8; c.height = 16;
    const g = c.getContext('2d'); g.fillStyle = '#17121f';
    [...BODY, ...legs].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g.fillRect(x, y, 1, 1); }));
    return c;
  }
  const IDLE = figure(LEGS.idle), WALK = [figure(LEGS.a), IDLE, figure(LEGS.b), IDLE];
  // Walker size is per scene (SCENES[id].fig, pixels per sprite pixel), set to
  // about the height of that scene's doors.

  // ---------- ambient life, drawn on a 3px grid to sit in the art's pixels ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const snap = v => Math.round(v / 3) * 3;
  function makeLife(L) {
    const st = { birds: [], leaves: [], drops: [], splashes: [], motes: [], glints: [], weed: null, nextBird: 2, nextWeed: 4 };
    if (L.rain) for (let i = 0; i < 230; i++) st.drops.push({ x: rand(-100, SW), y: rand(-SH, SH), v: rand(1300, 1700), len: rand(16, 30) });
    if (L.dust) for (let i = 0; i < 40; i++) st.motes.push({ x: rand(0, SW), y: rand(250, 700), ph: rand(0, 6) });
    if (L.sparkle) for (let i = 0; i < 70; i++) st.glints.push({ x: rand(60, SW - 60), y: rand(...L.sparkle.y), ph: rand(0, 6), w: 3 * ((rand(1, 4)) | 0) });
    return st;
  }
  // back: drawn behind the buildings (main layer covers it)
  function lifeBack(g, L, st, t, dt) {
    if (L.birds) {
      st.nextBird -= dt;
      if (st.nextBird <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1, y = rand(...L.birds.y), n = 1 + ((Math.random() * 4) | 0);
        for (let i = 0; i < n; i++) st.birds.push({ x: dir > 0 ? L.birds.x[0] - i * 30 : L.birds.x[1] + i * 30, y: y + i * 9 * (i % 2 ? 1 : -1), v: dir * rand(70, 110), ph: rand(0, 6), end: dir > 0 ? L.birds.x[1] + 200 : L.birds.x[0] - 200 });
        st.nextBird = rand(5, 11);
      }
      g.fillStyle = 'rgba(30,20,30,.75)';
      st.birds = st.birds.filter(b => {
        b.x += b.v * dt; const up = Math.sin(t * 9 + b.ph) > 0, x = snap(b.x), y = snap(b.y + Math.sin(t * 2 + b.ph) * 4);
        g.fillRect(x - 6, y + (up ? -3 : 0), 3, 3); g.fillRect(x - 3, y, 3, 3); g.fillRect(x, y, 3, 3); g.fillRect(x + 3, y + (up ? -3 : 0), 3, 3);
        return b.v > 0 ? b.x < b.end : b.x > b.end;
      });
    }
  }
  // front: in front of the buildings, behind the walker unless weather
  function lifeFront(g, L, st, t, dt) {
    if (L.sparkle) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const s of st.glints) {
        const a = Math.max(0, Math.sin(t * 2.2 + s.ph)) ** 6;
        if (a > 0.05) { g.fillStyle = `rgba(255,214,140,${0.7 * a})`; g.fillRect(snap(s.x), snap(s.y), s.w, 3); }
      }
      g.restore();
    }
    if (L.dust) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const m of st.motes) {
        m.x += Math.sin(t * 0.4 + m.ph) * 8 * dt + 6 * dt; m.y += Math.cos(t * 0.3 + m.ph) * 5 * dt;
        if (m.x > SW) m.x = 0;
        g.fillStyle = `rgba(255,200,120,${0.25 + 0.25 * Math.sin(t * 1.3 + m.ph)})`; g.fillRect(snap(m.x), snap(m.y), 3, 3);
      }
      g.restore();
    }
    if (L.tumbleweed) {
      st.nextWeed -= dt;
      if (!st.weed && st.nextWeed <= 0) st.weed = { x: -60, rot: 0 };
      const w = st.weed;
      if (w) {
        w.x += 210 * dt; w.rot += 6 * dt;
        const bounce = Math.abs(Math.sin(w.x / 55)) * 18, cx = w.x, cy = L.tumbleweed.y - 21 - bounce;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(snap(cx - 18), L.tumbleweed.y - 3, 36, 3);
        for (let i = 0; i < 26; i++) {
          const a = w.rot + i * 2.4, r = 6 + (i * 7) % 15;
          g.fillStyle = i % 3 ? '#8a6a3a' : '#b08a4e';
          g.fillRect(snap(cx + Math.cos(a) * r), snap(cy + Math.sin(a) * r), 3, 3);
        }
        if (w.x > SW + 60) { st.weed = null; st.nextWeed = rand(9, 16); }
      }
    }
    if (L.leaves) {
      const lv = L.leaves;
      if (Math.random() < (lv.rate || 1) * 1.2 * dt) {
        const fromAlso = lv.also && Math.random() < 0.4, xr = fromAlso ? lv.also : lv.x;
        st.leaves.push({ x: rand(...xr), y: rand(...lv.y), vy: rand(40, 70), ph: rand(0, 6), col: lv.colors[(Math.random() * lv.colors.length) | 0], age: 0 });
      }
      st.leaves = st.leaves.filter(l => {
        l.age += dt; l.y += l.vy * dt; l.x += Math.sin(t * 1.6 + l.ph) * 35 * dt - 12 * dt;
        const flip = Math.sin(t * 5 + l.ph) > 0;
        g.fillStyle = l.col; g.fillRect(snap(l.x), snap(l.y), flip ? 6 : 3, 3);
        return l.y < 900 && l.age < 20;
      });
    }
  }
  // weather: over everything
  function lifeOver(g, L, st, t, dt) {
    if (!L.rain) return;
    g.strokeStyle = 'rgba(200,222,242,.5)'; g.lineWidth = 3; g.beginPath();
    for (const d of st.drops) {
      d.y += d.v * dt; d.x += d.v * 0.12 * dt;
      if (d.y > d.end || d.y > SH) {
        if (d.end && d.y > d.end) st.splashes.push({ x: d.x, y: d.end, age: 0 });
        d.y = rand(-200, -20); d.x = rand(-150, SW); d.end = Math.random() < 0.55 ? rand(...L.rain.ground) : 0;
      }
      g.moveTo(d.x, d.y); g.lineTo(d.x - d.len * 0.12, d.y - d.len);
    }
    g.stroke();
    g.fillStyle = 'rgba(200,222,240,.45)';
    st.splashes = st.splashes.filter(s => {
      s.age += dt; const r = 3 + s.age * 40;
      g.fillRect(snap(s.x - r), snap(s.y), 3, 3); g.fillRect(snap(s.x + r), snap(s.y), 3, 3);
      return s.age < 0.18;
    });
  }

  // ---------- dialog ----------
  if (!document.querySelector('link[data-pixel-font]')) {
    const f = document.createElement('link');
    f.rel = 'stylesheet'; f.dataset.pixelFont = '';
    f.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
    document.head.appendChild(f);
  }
  const css = document.createElement('style');
  css.textContent = `
  .scene{padding:0;border:0;background:#0d0a12;color:#efe8f4;width:min(96vw,calc(88vh * 1672 / 941));max-width:none;max-height:96vh;overflow:auto;font:15px/1.5 system-ui,sans-serif}
  .scene::backdrop{background:rgba(6,4,10,.86)}
  .scene-bar{display:flex;gap:14px;align-items:center;padding:8px 12px}
  .scene-bar b{font:700 17px Georgia,serif}
  .scene-hint{flex:1;color:#bdb3c9;font-size:13px}
  .scene button{font:inherit;color:inherit;background:#241d30;border:1px solid #4a3f5e;border-radius:4px;padding:6px 12px;cursor:pointer}
  .scene button:hover{background:#342a45}
  .scene-stage{position:relative;container-type:inline-size}
  .scene-stage>canvas{display:block;width:100%;aspect-ratio:1672/941;cursor:pointer;outline-offset:-3px}
  .px-box{background:#0b0812;color:#f3ecf7;border:4px solid #f3ecf7;box-shadow:0 0 0 4px #0b0812,0 0 0 8px var(--acc),8px 12px 0 8px rgba(0,0,0,.45)}
  .scene-talk{position:absolute;left:4%;right:4%;bottom:5%;min-height:25%;padding:clamp(10px,2.2cqw,22px) clamp(12px,2.6cqw,26px) clamp(16px,3cqw,30px);font:clamp(17px,2.6cqw,30px)/1.15 VT323,ui-monospace,monospace;cursor:pointer;user-select:none}
  .scene-talk[hidden],.scene-panel[hidden]{display:none}
  .scene-talk .tag{position:absolute;top:-1.1em;left:18px;max-width:calc(100% - 36px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--acc);color:#0b0812;padding:2px 10px;font-size:.8em;letter-spacing:.05em}
  .scene-talk .more{position:absolute;right:14px;bottom:6px;color:var(--acc);animation:px-blink 1s steps(2) infinite}
  .scene-talk a{color:var(--acc)}
  .scene-talk .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  @keyframes px-blink{50%{opacity:0}}
  .scene-panel{position:absolute;inset:6% 9%;overflow:auto;padding:16px 20px;font:clamp(17px,2.2cqw,24px)/1.2 VT323,ui-monospace,monospace}
  .scene-panel h3{font:inherit;font-size:1.45em;margin:0 0 8px;color:#fff}
  .scene-panel .kick{font-size:.85em;letter-spacing:.08em;text-transform:uppercase;color:var(--acc);margin:0 0 4px}
  .scene-panel p{margin:0 0 8px}
  .scene-panel .actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .scene-panel button{font:inherit;border-radius:0;border:2px solid var(--acc);background:#0b0812}
  .scene-panel canvas{display:block;width:100%;aspect-ratio:16/9;image-rendering:pixelated;background:#08060c;cursor:pointer}
  .scene-panel .muted{color:#bdb3c9;font-size:.85em}
  .scene-loading{position:absolute;inset:0;display:grid;place-items:center;color:#bdb3c9;font-size:14px}
  .scene-loading[hidden]{display:none}
  @media (max-width:760px){.scene-talk,.scene-panel{position:relative;inset:auto;margin:26px 12px 12px;font-size:19px}}`;
  document.head.appendChild(css);

  const dlg = document.createElement('dialog');
  dlg.className = 'scene';
  dlg.innerHTML = `
    <div class="scene-bar"><b></b><span class="scene-hint"></span><button type="button" data-close>Close ✕</button></div>
    <div class="scene-stage"><canvas width="${SW}" height="${SH}" tabindex="0"></canvas><div class="scene-loading">Loading…</div>
      <div class="scene-talk px-box" hidden><span class="tag"></span><div class="txt" aria-hidden="true"></div><div class="sr" aria-live="polite"></div><span class="more" aria-hidden="true">▼</span></div>
      <div class="scene-panel px-box" hidden></div></div>`;
  document.body.appendChild(dlg);
  const canvas = dlg.querySelector('canvas'), g = canvas.getContext('2d');
  const talkBox = dlg.querySelector('.scene-talk'), talkTxt = talkBox.querySelector('.txt'), talkSr = talkBox.querySelector('.sr');
  const talkTag = talkBox.querySelector('.tag'), talkMore = talkBox.querySelector('.more');
  const panel = dlg.querySelector('.scene-panel'), hint = dlg.querySelector('.scene-hint'), loading = dlg.querySelector('.scene-loading');

  // ---------- state ----------
  // mode: walk -> enter (stepping into the door) -> talk | game -> exit -> walk
  const cache = {};
  let S = null, imgs = null, life = null, pos = 0, face = 1, target = null, pendingDoor = null, walkT = 0;
  let raf = 0, last = 0, mode = 'walk', anim = null, talk = null, hintNow, camX = 0;
  const camFor = x => (reduce ? 0 : -((x - SW / 2) / (SW / 2)) * PAN);
  const keys = { l: 0, r: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = p => p * p * (3 - 2 * p);
  const doorCenter = d => d.x + d.w / 2;
  const nearest = () => S.doors.find(d => Math.abs(pos - doorCenter(d)) < Math.max(60, d.w / 2 + 24)) || null;

  function load(id) {
    if (cache[id]) return cache[id];
    cache[id] = Promise.all(SCENES[id].layers.map(name => new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res([name, im]); im.onerror = rej;
      im.src = `assets/scenes/${id}/${name}.webp`;
    }))).then(Object.fromEntries).catch(err => { delete cache[id]; throw err; });
    return cache[id];
  }

  function draw(now, dt) {
    const t = now / 1000;
    const at = k => g.setTransform(Z, 0, 0, Z, (SW - SW * Z) / 2 + camX * k, (SH - SH * Z) / 2);
    const drawLayer = name => { at(DEPTH[name]); g.drawImage(imgs[name], 0, 0); };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, SW, SH);

    // where the walker is: on the street, or partway through a doorway
    let fx = pos, feet = S.feet, fs = 1, fa = 1, clip = null;
    if (anim) {
      const p = clamp((now - anim.t0) / (STEP_IN * 1000), 0, 1), e = anim.dir > 0 ? ease(p) : 1 - ease(p), d = anim.door;
      fx = anim.x0 + (doorCenter(d) - anim.x0) * e;
      feet = S.feet + (d.y + d.h - S.feet) * e;
      fs = 1 - 0.28 * e; fa = e < 0.55 ? 1 : 1 - (e - 0.55) / 0.45;
      if (e > 0.3) clip = [d.x - 4, d.y - 40, d.w + 8, d.h + 40];
    } else if (mode === 'talk' || mode === 'game') fa = 0;
    const drawWalker = () => {
      if (fa <= 0) return;
      const moving = target != null || keys.l || keys.r || anim;
      const spr = moving ? WALK[((walkT / 0.11) | 0) % 4] : IDLE;
      const fw = 8 * S.fig * fs, fh = 16 * S.fig * fs, x = Math.round(fx - fw / 2), y = feet - fh;
      g.save(); g.globalAlpha = fa;
      if (clip) { g.beginPath(); g.rect(...clip); g.clip(); }
      if (!anim) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(fx, feet, fw * 0.45, 10, 0, 0, Math.PI * 2); g.fill(); }
      if (anim) g.filter = `brightness(${1 - 0.5 * (1 - fa)})`;
      g.imageSmoothingEnabled = false;
      if (face > 0) g.drawImage(spr, x, y, fw, fh);
      else { g.translate(x + fw, y); g.scale(-1, 1); g.drawImage(spr, 0, 0, fw, fh); }
      g.restore();
    };

    drawLayer('background');
    if (life && !reduce) lifeBack(g, S.life, life, t, dt);
    if (imgs.recesses) drawLayer('recesses');
    drawLayer('main'); // doors, glow, walker and street life share the main layer's camera
    if (life && !reduce) lifeFront(g, S.life, life, t, dt);

    // the door you're at (or going through) pulses
    const active = anim ? anim.door : mode === 'walk' ? nearest() : null;
    if (active) {
      const d = active, pulse = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(t * 4.2);
      const cx = doorCenter(d), cy = d.y + d.h * 0.55, r = Math.max(d.w, d.h) * 0.8, a = 0.22 + 0.4 * pulse;
      g.save(); g.globalCompositeOperation = 'lighter';
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(255,255,255,${a})`); grad.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`); grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      g.fillStyle = `rgba(255,255,255,${0.1 + 0.22 * pulse})`; g.fillRect(d.x, d.y, d.w, d.h);
      g.restore();
    }
    drawWalker();
    drawLayer('foreground');
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (life && !reduce) lifeOver(g, S.life, life, t, dt);
  }

  function setHint() {
    const n = mode === 'walk' ? nearest() : null;
    const text = mode === 'talk' ? (touch ? 'Tap to continue.' : 'E, Space or click to continue. Esc to step back out.')
      : mode === 'game' ? 'Esc to step back out.'
      : n ? (touch ? 'Tap the glowing door to go in.' : 'Press E to go in.')
      : touch ? 'Tap the street to walk.' : 'Walk with ← → or A/D, or click where to go.';
    if (text !== hintNow) hint.textContent = hintNow = text;
  }

  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    if (mode === 'walk') {
      let dir = keys.r - keys.l;
      if (dir) target = pendingDoor = null;
      else if (target != null) {
        const dx = target - pos;
        if (Math.abs(dx) <= SPEED * dt + 1) {
          pos = target; target = null;
          if (pendingDoor) { const d = pendingDoor; pendingDoor = null; enter(d); }
        } else dir = Math.sign(dx);
      }
      if (dir) { pos = clamp(pos + dir * SPEED * dt, S.min, S.max); face = dir; walkT += dt; } else walkT = 0;
    } else if (anim) {
      walkT += dt;
      if (now - anim.t0 >= STEP_IN * 1000) {
        const a = anim; anim = null;
        if (a.dir > 0) arrive(a.door); else { mode = 'walk'; canvas.focus(); }
      }
    }
    if (talk && mode === 'talk') typeTick(dt);
    camX += (camFor(pos) - camX) * Math.min(1, dt * 3);
    draw(now, dt);
    setHint();
    raf = requestAnimationFrame(frame);
  }

  async function open(id) {
    S = SCENES[id]; imgs = null; life = makeLife(S.life); pos = S.spawn; face = 1; camX = camFor(pos);
    target = pendingDoor = anim = talk = null; mode = 'walk'; hintNow = undefined;
    talkBox.hidden = panel.hidden = true;
    dlg.querySelector('.scene-bar b').textContent = S.name;
    dlg.style.setProperty('--acc', S.accent);
    canvas.setAttribute('aria-label', `${S.name}: a side-on street scene. Walk with the arrow keys; a door glows when you reach one, and E goes in.`);
    loading.textContent = 'Loading…'; loading.hidden = false; hint.textContent = '';
    g.clearRect(0, 0, SW, SH);
    dlg.showModal();
    let got;
    try { got = await load(id); } catch { loading.textContent = 'The scene could not load.'; return; }
    if (!dlg.open || S !== SCENES[id]) return;
    imgs = got; loading.hidden = true; last = 0;
    raf = requestAnimationFrame(frame);
    canvas.focus();
  }
  function stop() { cancelAnimationFrame(raf); spreads.stop(); keys.l = keys.r = 0; anim = talk = null; mode = 'walk'; talkBox.hidden = panel.hidden = true; panel.innerHTML = ''; }

  // ---------- entering, talking, leaving ----------
  function enter(d) {
    if (mode !== 'walk') return;
    mode = 'enter'; keys.l = keys.r = 0; target = pendingDoor = null;
    face = doorCenter(d) >= pos ? 1 : -1;
    anim = { door: d, dir: 1, t0: performance.now() - (reduce ? STEP_IN * 1000 : 0), x0: pos };
  }
  function arrive(d) {
    lastDoor = d;
    if (d.game) {
      mode = 'game'; panel.hidden = false; spreads.intro();
      const h = panel.querySelector('h3'); if (h) { h.tabIndex = -1; h.focus(); }
      return;
    }
    const [tag, pages] = TALK[d.card];
    mode = 'talk'; talk = { door: d, pages, i: 0, shown: 0 };
    talkTag.textContent = tag; talkBox.hidden = false;
    showPage();
  }
  function leave() {
    if (mode !== 'talk' && mode !== 'game') return;
    const d = lastDoor;
    spreads.stop(); talk = null; talkBox.hidden = true; panel.hidden = true; panel.innerHTML = '';
    mode = 'exit'; anim = { door: d, dir: -1, t0: performance.now() - (reduce ? STEP_IN * 1000 : 0), x0: pos };
    canvas.focus();
  }
  let lastDoor = null;
  const pageText = p => (Array.isArray(p) ? p[0] : p);
  function showPage() {
    const p = talk.pages[talk.i];
    talk.shown = reduce ? pageText(p).length : 0;
    talkSr.textContent = pageText(p);
    renderPage();
  }
  function renderPage() {
    const p = talk.pages[talk.i], text = pageText(p), done = talk.shown >= text.length;
    talkTxt.textContent = text.slice(0, Math.floor(talk.shown));
    if (done && Array.isArray(p)) talkTxt.insertAdjacentHTML('beforeend', ` <a href="${p[2]}" data-leave>${p[1]}</a>`);
    talkMore.hidden = !done;
    talkMore.textContent = talk.i < talk.pages.length - 1 ? '▼' : '■';
  }
  function typeTick(dt) {
    const text = pageText(talk.pages[talk.i]);
    if (talk.shown >= text.length) return;
    talk.shown = Math.min(text.length, talk.shown + 55 * dt);
    renderPage();
  }
  function advance() {
    if (!talk) return;
    const text = pageText(talk.pages[talk.i]);
    if (talk.shown < text.length) { talk.shown = text.length; renderPage(); return; }
    if (talk.i < talk.pages.length - 1) { talk.i++; showPage(); } else leave();
  }

  // ---------- input ----------
  slots.forEach(slot => {
    const id = slot.dataset.scene;
    slot.setAttribute('aria-label', `${SCENES[id].name}: open a walkable scene with resume details`);
    slot.addEventListener('click', e => { e.preventDefault(); open(id); });
  });
  dlg.addEventListener('close', stop);
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
    if (e.target.closest('[data-leave]')) return dlg.close();
    if (e.target.closest('[data-back]')) return leave();
    if (mode === 'talk' && e.target.closest('.scene-talk, .scene-stage>canvas')) advance();
  });
  canvas.addEventListener('pointerdown', e => {
    if (mode !== 'walk' || !imgs) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * SW / r.width - (SW - SW * Z) / 2 - camX) / Z, y = ((e.clientY - r.top) * SH / r.height - (SH - SH * Z) / 2) / Z;
    const d = S.doors.find(d => x > d.x - 30 && x < d.x + d.w + 30 && y > d.y - 40 && y < d.y + d.h + 60);
    if (d && nearest() === d) return enter(d);
    pendingDoor = d || null;
    target = clamp(d ? doorCenter(d) : x, S.min, S.max);
  });
  dlg.addEventListener('keydown', e => {
    const k = e.key;
    if (mode === 'talk') {
      if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); advance(); }
      return;
    }
    if (mode !== 'walk') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.l = 1; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.r = 1; e.preventDefault(); }
    else if (k === 'e' || k === 'E' || k === 'ArrowUp' || ((k === 'Enter' || k === ' ') && e.target === canvas)) {
      const n = nearest(); if (n) { e.preventDefault(); enter(n); }
    }
  });
  dlg.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.l = 0;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.r = 0;
  });
  addEventListener('blur', () => { keys.l = keys.r = 0; });
  dlg.addEventListener('cancel', e => {
    if (mode === 'talk' || mode === 'game') { e.preventDefault(); leave(); }
    else if (mode !== 'walk') e.preventDefault();
  });

  // ---------- Spreads: an animated arcade trade ----------
  // Waha gas is bought, shipped down a pipe and sold at the Houston Ship
  // Channel. Shipping locks profit = (sell - buy - tariff) x 10,000 MMBtu at
  // that instant. The pipe holds three cargoes at a time (one while it's under
  // maintenance). Prices follow fixed curves, so every run is the same market
  // and only your timing differs. The prices are made up.
  const GW = 320, GH = 180, ROUND = 45, TARIFF = 0.4, VOL = 10000, TRANSIT = 2.4;
  const EVENTS = [
    { from: 14, to: 26, name: 'PIPE WORK: 1 SLOT, WAHA CRASHES' },
    { from: 32, to: 41, name: 'COLD SNAP: SHIP CHANNEL SPIKES' },
  ];
  const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));
  const buy = t => 1.6 + 0.35 * Math.sin(t * 0.9) + 0.2 * Math.sin(t * 2.3 + 1) - 1.3 * bump(t, 14, 26);
  const sell = t => 2.3 + 0.3 * Math.sin(t * 0.7 + 2) + 0.25 * Math.sin(t * 1.9) + 1.6 * bump(t, 32, 41);
  const spreadAt = t => sell(t) - buy(t) - TARIFF;
  const capacity = t => (t > 14 && t < 26 ? 1 : 3);
  const money = v => `${v < 0 ? '-' : '+'}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;

  const spreads = {
    raf: 0,
    intro() {
      panel.innerHTML = `<p class="kick">Houston · Spreads</p><h3>Buy in West Texas, Sell on the Coast</h3>
        <p>Gas at the Waha hub ships down a pipe to the Houston Ship Channel. Each cargo earns the sell price minus the buy price minus a $0.40 tariff, on 10,000 MMBtu, locked the moment you ship.</p>
        <p>Ship when the teal sell line clears the orange cost line. The pipe carries three cargoes at a time. Watch the news.</p>
        <p class="muted">Space, Enter or a tap ships a cargo. 45 seconds. The prices are made up; the timing is yours.</p>
        <div class="actions"><button type="button" data-play>Open the market</button><button type="button" data-back>Back outside</button></div>`;
      panel.querySelector('[data-play]').onclick = () => this.play();
    },
    play() {
      this.stop();
      panel.innerHTML = `<p class="kick">Houston · Spreads</p><canvas width="${GW}" height="${GH}" tabindex="0" aria-label="Spread game: a scrolling chart of the sell price against your cost, and a pipeline from Waha to Houston. Press space to ship."></canvas>
        <div class="actions"><button type="button" data-ship>Ship cargo</button><button type="button" data-back>Back outside</button></div>`;
      const c = panel.querySelector('canvas'), gg = c.getContext('2d');
      const st = { t: 0, pnl: 0, cargo: [], pops: [], trades: 0, best: -Infinity, flash: 0 };
      const ship = () => {
        if (st.t >= ROUND) return;
        if (st.cargo.length >= capacity(st.t)) { st.flash = 0.6; return; }
        const v = spreadAt(st.t) * VOL;
        st.cargo.push({ t0: st.t, v }); st.pops.push({ t0: st.t, v });
        st.pnl += v; st.trades++; st.best = Math.max(st.best, v);
      };
      c.addEventListener('pointerdown', ship);
      c.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ship(); } });
      panel.querySelector('[data-ship]').onclick = () => { ship(); c.focus(); };
      c.focus();
      let prev = 0;
      const tick = now => {
        const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0); prev = now;
        st.t += dt; st.flash = Math.max(0, st.flash - dt);
        st.cargo = st.cargo.filter(k => st.t - k.t0 < TRANSIT);
        this.render(gg, st);
        if (st.t >= ROUND && !st.cargo.length) return this.end(st);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    },
    render(gg, st) {
      const t = Math.min(st.t, ROUND);
      gg.fillStyle = '#08060c'; gg.fillRect(0, 0, GW, GH);
      pixelText(gg, 'SPREADS', 6, 5, 1, '#bdb3c9');
      const p = money(st.pnl); pixelText(gg, p, GW - 6 - textWidth(p, 1), 5, 1, st.pnl < 0 ? '#ff7a6b' : '#7fd38a');
      gg.fillStyle = '#241d30'; gg.fillRect(40, 6, 200, 3);
      gg.fillStyle = '#f2a855'; gg.fillRect(40, 6, 200 * (1 - t / ROUND), 3);

      // chart: the last 8 seconds scroll left, "now" at the right edge
      const X0 = 6, X1 = 230, Y0 = 16, Y1 = 104, span = 8;
      const ty = v => Y1 - ((v - 0) / 4.6) * (Y1 - Y0);
      gg.fillStyle = '#100c17'; gg.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      for (let x = X0; x <= X1; x++) {
        const tt = t - span + ((x - X0) / (X1 - X0)) * span;
        if (tt < 0) continue;
        const s = ty(sell(tt)), cst = ty(buy(tt) + TARIFF);
        gg.fillStyle = s < cst ? 'rgba(127,211,138,.35)' : 'rgba(255,122,107,.28)';
        gg.fillRect(x, Math.min(s, cst), 1, Math.abs(s - cst) || 1);
        gg.fillStyle = '#7fd3c4'; gg.fillRect(x, s - 1, 1, 2);
        gg.fillStyle = '#f2a855'; gg.fillRect(x, cst - 1, 1, 2);
      }
      for (const q of st.pops) {
        const x = X0 + ((q.t0 - (t - span)) / span) * (X1 - X0);
        if (x > X0) { gg.fillStyle = 'rgba(255,255,255,.45)'; gg.fillRect(x | 0, Y0, 1, Y1 - Y0); }
      }
      const sp = spreadAt(t);
      pixelText(gg, 'SELL', 238, 20, 1, '#7fd3c4'); pixelText(gg, sell(t).toFixed(2), 262, 20, 1, '#efe8f4');
      pixelText(gg, 'COST', 238, 30, 1, '#f2a855'); pixelText(gg, (buy(t) + TARIFF).toFixed(2), 262, 30, 1, '#efe8f4');
      pixelText(gg, 'SPREAD', 238, 44, 1, '#bdb3c9');
      pixelText(gg, (sp < 0 ? '-' : '+') + Math.abs(sp).toFixed(2), 238, 52, 2, sp < 0 ? '#ff7a6b' : '#7fd38a');
      pixelText(gg, 'WAHA ' + buy(t).toFixed(2), 238, 70, 1, '#bdb3c9');
      pixelText(gg, 'TARIFF 0.40', 238, 78, 1, '#bdb3c9');
      const ev = EVENTS.find(e => t > e.from && t < e.to);
      if (ev && (reduce || t - ev.from > 2 || ((t * 4) | 0) % 2 === 0)) {
        gg.fillStyle = 'rgba(8,6,12,.85)'; gg.fillRect(X0 + 2, Y0 + 2, textWidth(ev.name, 1) + 6, 9);
        pixelText(gg, ev.name, X0 + 5, Y0 + 4, 1, '#ffe08a');
      }

      // pipeline: Waha tank, pipe, Houston terminal
      const PY = 140, cap = capacity(t);
      gg.fillStyle = '#3a2d1a'; gg.fillRect(8, 118, 34, 36); gg.fillStyle = '#5a4526'; gg.fillRect(10, 120, 30, 6);
      pixelText(gg, 'WAHA', 17, 158, 1, '#f2a855');
      gg.fillStyle = '#1f3a3a'; gg.fillRect(278, 112, 34, 42); gg.fillStyle = '#2f5a58';
      for (let y = 116; y < 150; y += 6) gg.fillRect(282, y, 26, 3);
      pixelText(gg, 'HOUSTON', 267, 158, 1, '#7fd3c4');
      gg.fillStyle = '#2a2236'; gg.fillRect(42, PY - 4, 236, 9);
      gg.fillStyle = cap === 1 ? '#5a2a2a' : '#3a3046'; gg.fillRect(42, PY - 3, 236, 7);
      for (let x = 50; x < 278; x += 24) { gg.fillStyle = '#4a3f5e'; gg.fillRect(x, PY - 5, 2, 11); }
      for (const k of st.cargo) {
        const x = 44 + ((st.t - k.t0) / TRANSIT) * 226;
        gg.fillStyle = 'rgba(255,224,138,.25)'; gg.fillRect((x | 0) - 3, PY - 5, 14, 11);
        gg.fillStyle = k.v < 0 ? '#ff7a6b' : '#ffe08a'; gg.fillRect(x | 0, PY - 2, 8, 5);
      }
      pixelText(gg, 'PIPE', 116, 162, 1, '#bdb3c9');
      for (let i = 0; i < 3; i++) {
        const live = i < cap, free = i < cap - st.cargo.length;
        gg.fillStyle = !live ? '#2a2236' : free ? '#7fd38a' : '#ffe08a'; gg.fillRect(134 + i * 8, 162, 6, 5);
      }
      if (st.flash > 0) pixelText(gg, 'PIPE FULL', 164, 162, 1, '#ff7a6b');
      else if (st.t < ROUND) pixelText(gg, touch ? 'TAP TO SHIP' : 'SPACE TO SHIP', 164, 162, 1, '#6f6680');
      for (const q of st.pops) {
        const age = st.t - q.t0; if (age > 1.4) continue;
        pixelText(gg, money(q.v), 46, 120 - age * 14, 1, q.v < 0 ? '#ff7a6b' : '#7fd38a');
      }
    },
    end(st) {
      this.stop();
      const lesson = st.trades === 0 ? 'No cargo shipped. The market runs the same way every time, so you can learn its rhythm.'
        : 'The two news windows hold most of the money: cheap Waha gas while the pipe is narrow, then a Ship Channel spike once it reopens.';
      panel.innerHTML = `<p class="kick">Houston · Spreads</p><h3>Market Closed: ${money(st.pnl)}</h3>
        <p>${st.trades} cargo${st.trades === 1 ? '' : 'es'} shipped${st.trades ? `; best single cargo ${money(st.best)}` : ''}.</p>
        <p>${lesson}</p>
        <p class="muted">A real desk weighs the same three numbers: where to buy, where to sell, and what it costs to get there.</p>
        <div class="actions"><button type="button" data-play>Trade again</button><button type="button" data-back>Back outside</button></div>`;
      panel.querySelector('[data-play]').onclick = () => this.play();
      const h = panel.querySelector('h3'); h.tabIndex = -1; h.focus();
    },
    stop() { cancelAnimationFrame(this.raf); },
  };
})();
