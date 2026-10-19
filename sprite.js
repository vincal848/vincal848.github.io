// The walker: a Texas cowboy, side view, facing right. Drawn in code so it
// can be built at any height while keeping one sprite pixel = PX screen
// pixels, matching the scene art's fine pixel grid. Shapes are laid out on a
// 92-unit-tall body, rasterised with hard edges, then outlined.
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

  function body(g, dy) {
    // torso: shirt, vest on the near side, snaps down the front
    poly(g, [[15, 34 + dy], [29, 34 + dy], [29, 57], [16, 57]], C.shirt);
    poly(g, [[26, 35 + dy], [29, 35 + dy], [29, 57], [26, 57]], C.shirtLo);
    poly(g, [[14, 34 + dy], [25, 34 + dy], [26, 56], [15, 56]], C.vest);
    poly(g, [[14, 34 + dy], [17, 34 + dy], [17, 56], [15, 56]], C.vestLo);
    poly(g, [[23, 35 + dy], [25, 35 + dy], [26, 56], [24, 56]], C.vestHi);
    g.fillStyle = C.snap; for (const y of [39, 44, 49]) g.fillRect(27.5, y + dy, 1.5, 1.5);
    // belt and buckle, top of the jeans
    poly(g, [[15, 55], [29, 55], [29, 59], [15, 59]], C.belt);
    poly(g, [[25.5, 55], [29.5, 55], [29.5, 59], [25.5, 59]], C.buckle);
    poly(g, [[16, 59], [29, 59], [28, 64], [16, 64]], C.jean);
    // neck and bandana
    poly(g, [[20, 28 + dy], [26, 28 + dy], [26, 34 + dy], [20, 34 + dy]], C.skinLo);
    poly(g, [[18, 30 + dy], [28, 30 + dy], [27, 35 + dy], [19, 35 + dy]], C.scarf);
    poly(g, [[22, 34 + dy], [28, 34 + dy], [25, 39 + dy]], C.scarfLo);
    // head: face, jaw shadow, ear, sideburn, eye, nose
    ell(g, 24, 23.5 + dy, 6.2, 7, C.skin);
    poly(g, [[21, 29 + dy], [27, 29 + dy], [26, 30.5 + dy], [22, 30.5 + dy]], C.skinLo); // under the chin
    ell(g, 20.6, 23 + dy, 1.5, 2.2, C.skinLo); // ear
    poly(g, [[18.2, 18 + dy], [20, 18 + dy], [20, 24 + dy], [18.2, 23 + dy]], C.hair); // sideburn
    g.fillStyle = C.eye; g.fillRect(27, 21.5 + dy, 1.6, 1.6);
    poly(g, [[29.5, 21.5 + dy], [31.8, 24.8 + dy], [29.5, 25.3 + dy]], C.skinLo); // nose
    poly(g, [[26, 25.8 + dy], [31, 25.8 + dy], [30.5, 27.4 + dy], [26.5, 27.4 + dy]], C.hair); // mustache
    g.fillStyle = C.skinLo; g.fillRect(19, 18.5 + dy, 12, 1.6); // brim shadow
    // hat: pinched crown, band, wide brim curling at the ends
    poly(g, [[14, 15 + dy], [15, 6 + dy], [17, 3 + dy], [22, 5 + dy], [27, 3 + dy], [29, 6 + dy], [30, 15 + dy]], C.hat);
    poly(g, [[15, 6 + dy], [17, 3 + dy], [19, 4 + dy], [18, 15 + dy], [14, 15 + dy]], C.hatLo);
    poly(g, [[24, 5 + dy], [27, 3 + dy], [28, 5 + dy], [26, 9 + dy]], C.hatHi);
    poly(g, [[14, 12.5 + dy], [30, 12.5 + dy], [30, 15 + dy], [14, 15 + dy]], C.band);
    poly(g, [[5, 14 + dy], [9, 16 + dy], [22, 17 + dy], [35, 16 + dy], [39, 13.5 + dy], [37, 18 + dy], [22, 19.5 + dy], [7, 18 + dy]], C.hat);
    poly(g, [[7, 17.5 + dy], [22, 19 + dy], [37, 17.5 + dy], [36, 18.6 + dy], [22, 20 + dy], [8, 18.6 + dy]], C.hatLo);
    poly(g, [[10, 15.6 + dy], [22, 16.6 + dy], [33, 15.6 + dy], [33, 16.4 + dy], [22, 17.4 + dy], [10, 16.4 + dy]], C.hatHi);
  }

  // Rasterise a pose at `rows` sprite pixels tall: hard alpha, then a 1px outline.
  function render(rows, pose) {
    const s = rows / 92, w = Math.ceil(46 * s) + 2, h = rows + 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.translate(1, 1); g.scale(s, s);
    arm(g, ...pose.armFar, true, pose.dy);
    leg(g, ...pose.legFar, true);
    leg(g, ...pose.legNear, false);
    body(g, pose.dy);
    arm(g, ...pose.armNear, false, pose.dy);
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
    const walk = [];
    for (let f = 0; f < 8; f++) {
      const p = (f / 8) * Math.PI * 2, s = Math.sin(p);
      walk.push(render(rows, {
        dy: Math.abs(Math.cos(p)) > 0.7 ? 0 : 0.6,
        legNear: [0.42 * s, 0.55 * Math.max(0, -Math.cos(p)) + 0.1],
        legFar: [-0.42 * s, 0.55 * Math.max(0, Math.cos(p)) + 0.1],
        armNear: [-0.38 * s, 0.35], armFar: [0.38 * s, 0.35],
      }));
    }
    const still = dy => render(rows, { dy, legNear: [0.06, 0.04], legFar: [-0.06, 0.04], armNear: [0.04, 0.12], armFar: [-0.04, 0.12] });
    return (cache[rows] = { idle: [still(0), still(0.7)], walk, px: PX, footPad: 1 });
  };
})();
