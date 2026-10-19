// The walker: a Texas cowboy. Drawn in code so it can be built at any height
// while keeping one sprite pixel = PX screen pixels, matching the scene art's
// fine pixel grid. Shapes are laid out on a 92-unit-tall body, rasterised
// with hard edges, then outlined. Three views: side (walking the street),
// back (walking or climbing toward a door) and front (coming back out).
// scene.js calls window.makeWalker(heightInScreenPx).
(() => {
  const PX = 2;
  const C = {
    hat: '#a8743d', hatHi: '#c99555', hatLo: '#7a5028', band: '#3a2414',
    skin: '#c98d5f', skinLo: '#9c6642', hair: '#3b2416', eye: '#20140c',
    scarf: '#b8322a', scarfLo: '#8a221c',
    shirt: '#7d9cc4', shirtLo: '#58779f', snap: '#f2efe6',
    vest: '#5e3b21', vestLo: '#432915', vestHi: '#7a5131',
    belt: '#2f1d10', buckle: '#d8d2bd',
    jean: '#3e5c8c', jeanLo: '#2b4268', jeanHi: '#5374a6',
    boot: '#6b3f1f', bootLo: '#4a2a13', spur: '#c9c4b4',
    line: '#1b120b',
  };

  function poly(g, pts, col) { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); }
  function ell(g, x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
  function limb(g, x0, y0, x1, y1, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  const at = (x, y, len, a) => [x + Math.sin(a) * len, y + Math.cos(a) * len];

  // ---------- side view (facing right) ----------
  // One leg: thigh angle a (radians from straight down, + is forward), knee bend k.
  function leg(g, a, k, far) {
    const hip = [22, 62], knee = at(...hip, 13, a), ankle = at(...knee, 12, a - k);
    limb(g, ...hip, ...knee, 7, far ? C.jeanLo : C.jean);
    limb(g, ...knee, ...ankle, 6, far ? C.jeanLo : C.jean);
    if (!far) limb(g, hip[0] + 2, hip[1] + 1, knee[0] + 2, knee[1], 1.5, C.jeanHi);
    const [ax, ay] = ankle, b = far ? C.bootLo : C.boot;
    poly(g, [[ax - 3, ay - 6], [ax + 3, ay - 6], [ax + 3, ay], [ax + 10, ay + 1], [ax + 8, ay + 3], [ax - 4, ay + 3], [ax - 4, ay]], b);
    poly(g, [[ax - 4, ay + 1], [ax - 1, ay + 1], [ax - 1, ay + 3], [ax - 4, ay + 3]], C.bootLo);
    g.fillStyle = C.spur; g.fillRect(ax - 6, ay, 2, 2);
  }
  // One arm from the shoulder: upper angle a, elbow bend e.
  function arm(g, a, e, far, dy) {
    const sh = [21, 37 + dy], el = at(...sh, 11, a), wr = at(...el, 10, a + e);
    limb(g, ...sh, ...el, 5, far ? C.shirtLo : C.shirt);
    limb(g, ...el, ...wr, 4.5, far ? C.shirtLo : C.shirt);
    ell(g, wr[0], wr[1] + 1, 2.2, 2.4, far ? C.skinLo : C.skin);
  }
  function sideBody(g, dy) {
    poly(g, [[15, 34 + dy], [29, 34 + dy], [29, 57], [16, 57]], C.shirt);
    poly(g, [[26, 35 + dy], [29, 35 + dy], [29, 57], [26, 57]], C.shirtLo);
    poly(g, [[14, 34 + dy], [25, 34 + dy], [26, 56], [15, 56]], C.vest);
    poly(g, [[14, 34 + dy], [17, 34 + dy], [17, 56], [15, 56]], C.vestLo);
    poly(g, [[23, 35 + dy], [25, 35 + dy], [26, 56], [24, 56]], C.vestHi);
    g.fillStyle = C.snap; for (const y of [39, 44, 49]) g.fillRect(27.5, y + dy, 1.5, 1.5);
    poly(g, [[15, 55], [29, 55], [29, 59], [15, 59]], C.belt);
    poly(g, [[25.5, 55], [29.5, 55], [29.5, 59], [25.5, 59]], C.buckle);
    poly(g, [[16, 59], [29, 59], [28, 64], [16, 64]], C.jean);
    poly(g, [[20, 28 + dy], [26, 28 + dy], [26, 34 + dy], [20, 34 + dy]], C.skinLo);
    poly(g, [[18, 30 + dy], [28, 30 + dy], [27, 35 + dy], [19, 35 + dy]], C.scarf);
    poly(g, [[22, 34 + dy], [28, 34 + dy], [25, 39 + dy]], C.scarfLo);
    ell(g, 24, 23.5 + dy, 6.2, 7, C.skin);
    poly(g, [[21, 29 + dy], [27, 29 + dy], [26, 30.5 + dy], [22, 30.5 + dy]], C.skinLo); // under the chin
    ell(g, 20.6, 23 + dy, 1.5, 2.2, C.skinLo); // ear
    poly(g, [[18.2, 18 + dy], [20, 18 + dy], [20, 24 + dy], [18.2, 23 + dy]], C.hair); // sideburn
    g.fillStyle = C.eye; g.fillRect(27, 21.5 + dy, 1.6, 1.6);
    poly(g, [[29.5, 21.5 + dy], [31.8, 24.8 + dy], [29.5, 25.3 + dy]], C.skinLo); // nose
    poly(g, [[26, 25.8 + dy], [31, 25.8 + dy], [30.5, 27.4 + dy], [26.5, 27.4 + dy]], C.hair); // mustache
    g.fillStyle = C.skinLo; g.fillRect(19, 18.5 + dy, 12, 1.6); // brim shadow
    poly(g, [[14, 15 + dy], [15, 6 + dy], [17, 3 + dy], [22, 5 + dy], [27, 3 + dy], [29, 6 + dy], [30, 15 + dy]], C.hat);
    poly(g, [[15, 6 + dy], [17, 3 + dy], [19, 4 + dy], [18, 15 + dy], [14, 15 + dy]], C.hatLo);
    poly(g, [[24, 5 + dy], [27, 3 + dy], [28, 5 + dy], [26, 9 + dy]], C.hatHi);
    poly(g, [[14, 12.5 + dy], [30, 12.5 + dy], [30, 15 + dy], [14, 15 + dy]], C.band);
    poly(g, [[5, 14 + dy], [9, 16 + dy], [22, 17 + dy], [35, 16 + dy], [39, 13.5 + dy], [37, 18 + dy], [22, 19.5 + dy], [7, 18 + dy]], C.hat);
    poly(g, [[7, 17.5 + dy], [22, 19 + dy], [37, 17.5 + dy], [36, 18.6 + dy], [22, 20 + dy], [8, 18.6 + dy]], C.hatLo);
    poly(g, [[10, 15.6 + dy], [22, 16.6 + dy], [33, 15.6 + dy], [33, 16.4 + dy], [22, 17.4 + dy], [10, 16.4 + dy]], C.hatHi);
  }
  function drawSide(g, p) {
    arm(g, ...p.armFar, true, p.dy);
    leg(g, ...p.legFar, true);
    leg(g, ...p.legNear, false);
    sideBody(g, p.dy);
    arm(g, ...p.armNear, false, p.dy);
  }

  // ---------- back and front views (centred on x = 21) ----------
  // A straight-on leg whose foot is raised by r units (knee bends toward the
  // viewer for the front view, away for the back), so a raised foot can sit
  // exactly one stair tread above the other.
  function legOn(g, x, r, view) {
    const ankle = 87 - r, knee = 74 - r * 0.55, bend = r > 0 ? (view === 'front' ? 1.2 : -0.6) : 0;
    limb(g, x, 62, x + bend, knee, 7, C.jean);
    limb(g, x + bend, knee, x, ankle, 6, C.jean);
    if (view === 'front') {
      limb(g, x - 1.5, 63, x - 1.5 + bend, knee, 1.4, C.jeanHi);
      poly(g, [[x - 3.5, ankle - 6], [x + 3.5, ankle - 6], [x + 3.5, ankle], [x - 3.5, ankle]], C.boot);
      ell(g, x, ankle + 1.2, 4.6, 2.2, C.boot); // toe toward the viewer
      ell(g, x, ankle + 0.4, 2.5, 1, C.bootLo);
    } else {
      poly(g, [[x - 3.5, ankle - 6], [x + 3.5, ankle - 6], [x + 3.8, ankle + 3], [x - 3.8, ankle + 3]], C.boot);
      poly(g, [[x - 3.8, ankle + 1], [x + 3.8, ankle + 1], [x + 3.8, ankle + 3], [x - 3.8, ankle + 3]], C.bootLo); // heel
      g.fillStyle = C.spur; g.fillRect(x - 5.5, ankle, 1.6, 1.6); g.fillRect(x + 3.9, ankle, 1.6, 1.6);
    }
  }
  function armOn(g, x, side, dh) {
    const hy = 56 + dh;
    limb(g, x, 37, x + side * 2, hy - 1, 5, C.shirt);
    ell(g, x + side * 2, hy, 2.2, 2.4, C.skin);
  }
  function drawFacing(g, view, p) {
    const front = view === 'front';
    armOn(g, 12.5, -1, p.arm[0]);
    armOn(g, 29.5, 1, p.arm[1]);
    legOn(g, 17, p.lift[0], view);
    legOn(g, 25, p.lift[1], view);
    // torso
    poly(g, [[13, 34], [29, 34], [29, 59], [13, 59]], C.shirt);
    if (front) {
      poly(g, [[12.5, 34], [18.5, 34], [18.5, 56], [12.5, 56]], C.vest);
      poly(g, [[23.5, 34], [29.5, 34], [29.5, 56], [23.5, 56]], C.vest);
      poly(g, [[12.5, 34], [14.5, 34], [14.5, 56], [12.5, 56]], C.vestLo);
      g.fillStyle = C.snap; for (const y of [39, 44, 49]) g.fillRect(20.3, y, 1.5, 1.5);
    } else {
      poly(g, [[12.5, 34], [29.5, 34], [29.5, 56], [12.5, 56]], C.vest);
      poly(g, [[20.5, 36], [21.5, 36], [21.5, 56], [20.5, 56]], C.vestLo); // back seam
      poly(g, [[12.5, 34], [14.5, 34], [14.5, 56], [12.5, 56]], C.vestLo);
    }
    poly(g, [[13, 55], [29, 55], [29, 59], [13, 59]], C.belt);
    if (front) poly(g, [[18.8, 55], [23.2, 55], [23.2, 59], [18.8, 59]], C.buckle);
    poly(g, [[13.5, 59], [28.5, 59], [28.5, 65], [13.5, 65]], C.jean);
    // neck, bandana
    poly(g, [[18, 28], [24, 28], [24, 34], [18, 34]], C.skinLo);
    poly(g, [[15.5, 30], [26.5, 30], [26, 35], [16, 35]], C.scarf);
    if (front) poly(g, [[17, 34], [25, 34], [21, 40]], C.scarfLo);
    else poly(g, [[19.5, 34], [22.5, 34], [21, 37.5]], C.scarfLo); // knot
    // head
    if (front) {
      ell(g, 21, 23.5, 6.2, 7, C.skin);
      ell(g, 14.6, 23, 1.4, 2.2, C.skinLo); ell(g, 27.4, 23, 1.4, 2.2, C.skinLo);
      poly(g, [[15, 18], [16.6, 18], [16.6, 24], [15, 23]], C.hair);
      poly(g, [[25.4, 18], [27, 18], [27, 23], [25.4, 24]], C.hair);
      g.fillStyle = C.eye; g.fillRect(18, 21.5, 1.6, 1.6); g.fillRect(22.4, 21.5, 1.6, 1.6);
      poly(g, [[20.4, 22], [21.6, 22], [21.8, 25], [20.2, 25]], C.skinLo); // nose
      poly(g, [[17.5, 25.8], [24.5, 25.8], [23.8, 27.4], [18.2, 27.4]], C.hair); // mustache
      poly(g, [[18.5, 29], [23.5, 29], [22.8, 30.5], [19.2, 30.5]], C.skinLo);
      g.fillStyle = C.skinLo; g.fillRect(15, 18.5, 12, 1.6); // brim shadow
    } else {
      ell(g, 14.6, 23, 1.4, 2.2, C.skin); ell(g, 27.4, 23, 1.4, 2.2, C.skin);
      ell(g, 21, 23, 6.2, 7, C.hair);
      poly(g, [[16.5, 27], [25.5, 27], [24.5, 30], [17.5, 30]], C.hair);
    }
    // hat: crown with a pinch, band, brim seen edge-on as a flat ellipse
    poly(g, [[13, 15], [14, 6], [16, 3], [21, 4.6], [26, 3], [28, 6], [29, 15]], C.hat);
    poly(g, [[19.5, 4.4], [22.5, 4.4], [22, 11], [20, 11]], C.hatLo); // centre crease
    poly(g, [[13, 12.5], [29, 12.5], [29, 15], [13, 15]], C.band);
    ell(g, 21, 16.4, 17.5, 3.1, C.hat);
    if (front) ell(g, 21, 17.4, 16, 1.8, C.hatLo);
    else ell(g, 21, 15.6, 15.5, 1.6, C.hatHi);
  }

  // Rasterise at `rows` sprite pixels tall: hard alpha, then a 1px outline.
  function render(rows, width, draw) {
    const s = rows / 92, w = Math.ceil(width * s) + 2, h = rows + 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.translate(1, 1); g.scale(s, s);
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const img = g.getImageData(0, 0, w, h), d = img.data, solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { solid[i] = d[i * 4 + 3] > 110; d[i * 4 + 3] = solid[i] ? 255 : 0; }
    const [lr, lg, lb] = [1, 3, 5].map(k => parseInt(C.line.slice(k, k + 2), 16));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        d.set([lr, lg, lb, 255], i * 4);
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  const cache = {};
  window.makeWalker = screenHeight => {
    const rows = Math.max(40, Math.round(screenHeight / PX));
    if (cache[rows]) return cache[rows];
    const side = p => render(rows, 46, g => drawSide(g, p));
    const facing = (view, lift, arms) => render(rows, 42, g => drawFacing(g, view, { lift, arm: arms }));
    const walk = [];
    for (let f = 0; f < 8; f++) {
      const p = (f / 8) * Math.PI * 2, s = Math.sin(p);
      walk.push(side({
        dy: Math.abs(Math.cos(p)) > 0.7 ? 0 : 0.6,
        legNear: [0.42 * s, 0.55 * Math.max(0, -Math.cos(p)) + 0.1],
        legFar: [-0.42 * s, 0.55 * Math.max(0, Math.cos(p)) + 0.1],
        armNear: [-0.38 * s, 0.35], armFar: [0.38 * s, 0.35],
      }));
    }
    const still = dy => side({ dy, legNear: [0.06, 0.04], legFar: [-0.06, 0.04], armNear: [0.04, 0.12], armFar: [-0.04, 0.12] });
    const views = {};
    for (const v of ['back', 'front']) {
      views[v] = {
        stand: facing(v, [0, 0], [0, 0]),
        walk: [facing(v, [0, 3], [2, -2]), facing(v, [0, 0], [0, 0]), facing(v, [3, 0], [-2, 2]), facing(v, [0, 0], [0, 0])],
      };
    }
    const lifts = {};
    // One foot raised by exactly riserPx screen pixels (one stair tread).
    const lift = (view, legIndex, riserPx) => {
      const units = Math.round(riserPx / PX) * 92 / rows, key = `${view}${legIndex}${Math.round(riserPx / PX)}`;
      return (lifts[key] ||= facing(view, legIndex ? [0, units] : [units, 0], legIndex ? [2, -1] : [-1, 2]));
    };
    return (cache[rows] = { idle: [still(0), still(0.7)], walk, back: views.back, front: views.front, lift, px: PX, footPad: 1 });
  };
})();
