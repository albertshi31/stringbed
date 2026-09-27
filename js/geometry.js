/* Hoop geometry and stringbed layout.
 *
 * A real racket head is not symmetric top to bottom: it is widest a little
 * ABOVE the middle, fuller and squarer over the tip, and tapers as it runs
 * down into the yoke. So the hoop here is two superellipse halves sharing a
 * width, each with its own height and exponent:
 *
 *      |x/a|^n + |y/b|^n = 1        (screen coords, y grows downward)
 *
 * top half:    b = bT, n = nT   (taller, squarer -- nT ~2.5, isometric ~2.7)
 * bottom half: b = bB, n = nB   (shorter, rounder, tapering into the throat)
 */
const Geo = (function () {

  function makeHoop(a, bT, bB, nT, nB) {
    const half = y => (y >= 0 ? { b: bB, n: nB } : { b: bT, n: nT });

    const H = {
      a: a, bT: bT, bB: bB, nT: nT, nB: nB,

      /* y on the hoop for a given x, on the requested half */
      yAt(x, bottom) {
        const b = bottom ? bB : bT, n = bottom ? nB : nT;
        const t = 1 - Math.pow(Math.min(1, Math.abs(x) / a), n);
        const y = t <= 0 ? 0 : b * Math.pow(t, 1 / n);
        return bottom ? y : -y;
      },
      /* half-width of the hoop at a given y */
      xAt(y) {
        const h = half(y);
        const t = 1 - Math.pow(Math.min(1, Math.abs(y) / h.b), h.n);
        return t <= 0 ? 0 : a * Math.pow(t, 1 / h.n);
      },
      /* point at parameter t (0 = 3 o'clock, pi/2 = bottom, 3pi/2 = tip) */
      pt(t) {
        const c = Math.cos(t), s = Math.sin(t);
        const h = s >= 0 ? { b: bB, n: nB } : { b: bT, n: nT };
        const e = 2 / h.n;
        return [a * Math.sign(c) * Math.pow(Math.abs(c), e),
                h.b * Math.sign(s) * Math.pow(Math.abs(s), e)];
      },
      /* outward unit normal at a point on the hoop */
      normal(x, y) {
        const h = half(y);
        const gx = (Math.abs(x) < 1e-9) ? 0
          : Math.sign(x) * Math.pow(Math.abs(x) / a, h.n - 1) / a;
        const gy = (Math.abs(y) < 1e-9) ? 0
          : Math.sign(y) * Math.pow(Math.abs(y) / h.b, h.n - 1) / h.b;
        const L = Math.hypot(gx, gy) || 1;
        return [gx / L, gy / L];
      },
      /* the point at t pushed out along the normal by k (number or fn(t)) */
      offset(t, k) {
        const p = H.pt(t);
        const nm = H.normal(p[0], p[1]);
        const d = typeof k === 'function' ? k(t) : k;
        return [p[0] + nm[0] * d, p[1] + nm[1] * d];
      },
      /* parameter t of a point that lies on the hoop */
      tAtPoint(x, y) {
        const h = half(y);
        const c = Math.sign(x) * Math.pow(Math.min(1, Math.abs(x) / a), h.n / 2);
        const s = Math.sign(y) * Math.pow(Math.min(1, Math.abs(y) / h.b), h.n / 2);
        return Math.atan2(s, c);
      },
      /* parameter t for a given x on the top or bottom half */
      tAtX(x, bottom) {
        const n = bottom ? nB : nT;
        const c = Math.sign(x) * Math.pow(Math.min(1, Math.abs(x) / a), n / 2);
        const t = Math.acos(Math.max(-1, Math.min(1, c)));   // 0..pi (bottom)
        return bottom ? t : -t;
      },
      /* closed outline, offset outward by k */
      outline(k, steps) {
        steps = steps || 320;
        const p = [];
        for (let i = 0; i < steps; i++) p.push(H.offset((i / steps) * Math.PI * 2, k));
        return p;
      },
      /* open polyline between two parameters, offset outward by k */
      sweep(t1, t2, k, steps) {
        steps = steps || 70;
        const p = [];
        for (let i = 0; i <= steps; i++) p.push(H.offset(t1 + (t2 - t1) * (i / steps), k));
        return p;
      },
      expand(k) { return makeHoop(a + k, bT + k, bB + k, nT, nB); }
    };
    return H;
  }

  const MM2_PER_IN2 = 645.16;

  /* Area enclosed by a hoop, by horizontal strips. Exact enough at 512 strips
     that the residual is far below the millimetre this is used to. */
  function areaOf(H) {
    const N = 512, dy = (H.bT + H.bB) / N;
    let A = 0;
    for (let i = 0; i < N; i++) A += 2 * H.xAt(-H.bT + (i + 0.5) * dy) * dy;
    return A;
  }

  /* ONE SIZE, not two.
   *
   * A racket entry states its head size AND its hoop dimensions, and the
   * superellipse fitted to those dimensions does not enclose exactly that
   * area -- it came out about 5% over on every frame in the catalogue. That
   * left two sources of truth for one measurement: stats() reads
   * racket.headSize for density and stiffness, while every string length is
   * measured off the drawn hoop. The picture and the numbers disagreed.
   *
   * Scaling both semi-axes by one factor fixes it without touching the SHAPE:
   * area goes as k², so k = sqrt(stated / drawn), and every proportion the
   * entry describes -- the width fudge above, the exponents, the bias -- comes
   * through unchanged. Memoised, because buildStringbed runs on every render
   * and the answer only depends on numbers that never move. */
  const scaleCache = new Map();
  function sized(H, headSize) {
    if (!headSize) return H;
    const key = [H.a, H.bT, H.bB, H.nT, H.nB, headSize].join(',');
    let k = scaleCache.get(key);
    if (k === undefined) {
      k = Math.sqrt((headSize * MM2_PER_IN2) / areaOf(H));
      scaleCache.set(key, k);
    }
    return makeHoop(H.a * k, H.bT * k, H.bB * k, H.nT, H.nB);
  }

  /* build the hoop described by a racket entry */
  function hoopFor(racket) {
    /* The catalogue's headWidth is the moulding spec; what is drawn is a hair
       wider, because a superellipse rounded enough not to read as a capsule
       loses width through the middle and has to be given it back. */
    const a = racket.headWidth / 2 * 1.015;
    const L = racket.headLength;
    const bias = racket.headBias || 0.52;        // share of the length above the widest point
    /* Held at the frame's own exponent the sides ran vertical for most of the
       hoop -- a rounded rectangle, not an oval. Rounding the TOP half alone
       starts the sides curving in earlier and softens the shoulders at 10 and
       2 o'clock, and leaves the lower hoop and its run into the throat exactly
       as they were. */
    const nT = racket.shapeTop || racket.shapeN * 0.96;
    // The yoke end is shallower than the tip end, so it has to narrow faster
    // to reach the throat -- but barely. Drop the exponent below the top
    // half's by more than a hair and the lower hoop pinches in like an egg
    // instead of easing into the throat; kept this close, the curvature runs
    // continuously from tip to yoke with no change of character at the waist.
    const nB = racket.shapeBot || racket.shapeN * 0.99;
    return sized(makeHoop(a, L * bias, L * (1 - bias), nT, nB), racket.headSize);
  }

  function pathFrom(points, open) {
    let d = 'M' + points[0][0].toFixed(2) + ',' + points[0][1].toFixed(2);
    for (let i = 1; i < points.length; i++)
      d += 'L' + points[i][0].toFixed(2) + ',' + points[i][1].toFixed(2);
    return open ? d : d + 'Z';
  }

  function parsePattern(str) {
    const m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(String(str).trim());
    return m ? { mains: parseInt(m[1], 10), crosses: parseInt(m[2], 10) } : null;
  }

  /* Every main, cross, intersection and grommet position. */
  function buildStringbed(racket, patternStr) {
    const pat = parsePattern(patternStr || racket.pattern);
    const H = hoopFor(racket);

    // ---- mains: vertical, evenly spaced about the centre line -------------
    const mainHalf = H.a * racket.mainSpan;
    const mainGap = (2 * mainHalf) / (pat.mains - 1);
    const mains = [];
    for (let i = 0; i < pat.mains; i++) {
      const x = -mainHalf + i * mainGap;
      const top = H.yAt(x, false), bottom = H.yAt(x, true);
      mains.push({ i: i, x: x, top: top, bottom: bottom, len: bottom - top });
    }

    // ---- crosses: from under the tip down to just above the yoke ----------
    const yTop = -H.bT * racket.crossTop;
    const yBot = H.bB * racket.crossBottom;
    const crossGap = (yBot - yTop) / (pat.crosses - 1);
    const crosses = [];
    for (let j = 0; j < pat.crosses; j++) {
      const y = yTop + j * crossGap;
      const x = H.xAt(y);
      crosses.push({ j: j, y: y, left: -x, right: x, len: 2 * x });
    }

    // ---- weave: alternate which string sits on top at each crossing --------
    const inters = [];
    for (const m of mains)
      for (const c of crosses) {
        if (Math.abs(m.x) >= c.right || c.y <= m.top || c.y >= m.bottom) continue;
        inters.push({ x: m.x, y: c.y, mainOver: (m.i + c.j) % 2 === 0 });
      }

    // ---- grommets ----------------------------------------------------------
    // each hole carries the direction its string leaves in, so the hole can be
    // drawn ON that line instead of offset radially away from it
    const holes = [];
    for (const m of mains) {
      holes.push({ x: m.x, y: m.top, dx: 0, dy: -1 });
      holes.push({ x: m.x, y: m.bottom, dx: 0, dy: 1 });
    }
    for (const c of crosses) {
      holes.push({ x: c.left, y: c.y, dx: -1, dy: 0 });
      holes.push({ x: c.right, y: c.y, dx: 1, dy: 0 });
    }

    const mainLen = mains.reduce((s, m) => s + m.len, 0);
    const crossLen = crosses.reduce((s, c) => s + c.len, 0);

    return {
      pattern: pat, patternLabel: pat.mains + 'x' + pat.crosses,
      hoop: H, a: H.a, bT: H.bT, bB: H.bB,
      mains: mains, crosses: crosses, intersections: inters, holes: holes,
      mainGap: mainGap, crossGap: crossGap,
      mainLenMm: mainLen, crossLenMm: crossLen
    };
  }

  /* Practical stringing numbers a stringer actually cares about. */
  function stats(racket, bed, tMain, tCross, stringMain, stringCross, gMain, gCross) {
    /* What is INSTALLED -- string inside the hoop, and nothing else.
     *
     * Two things were wrong here. A flat 900 mm was added to each bunch, which
     * is working allowance, not string in the bed; it was then reported as
     * "ends up in the racket" and a cutting allowance was added on top of it,
     * so the allowance was counted twice. That put ten of the frames in the
     * catalogue over a standard 12.2 m set -- including a Blade 98, which
     * every stringer in the world does from one set with metres to spare.
     *
     * And weaving does not add the same to both planes. A main runs essentially
     * straight between its grommets; a cross has to undulate over and under
     * every main it passes, which is where the extra length actually goes. */
    const WEAVE_MAIN = 1.02, WEAVE_CROSS = 1.07;
    /* Every string also goes through the hoop wall at both ends and runs round
       the outside of the frame to the next hole. Leaving that out made a one
       piece come up short at the tie-off: about 4 cm a string, 1.4 m on a
       16x19. Two passes through the wall, plus the hop to the neighbouring
       hole, which is about one string gap. */
    const WALL_M = 0.024;
    const loop = gapMm => WALL_M + gapMm / 1000;
    const mainM = (bed.mainLenMm * WEAVE_MAIN) / 1000 + bed.mains.length * loop(bed.mainGap);
    const crossM = (bed.crossLenMm * WEAVE_CROSS) / 1000 + bed.crosses.length * loop(bed.crossGap);
    const totalM = mainM + crossM;

    const headSqIn = racket.headSize;
    const density = (bed.mains.length + bed.crosses.length) / headSqIn;
    const openness = (bed.mainGap + bed.crossGap) / 2;

    // A string's axial stiffness scales with its cross-sectional area, so a
    // thicker gauge plays stiffer at the same tension and a thinner one softer.
    // 1.25 mm is the reference gauge the stiffness indices are quoted at.
    const G0 = 1.25;
    const sMain = stringMain ? stringMain.stiffness : 200;
    const sCross = stringCross ? stringCross.stiffness : 200;
    const dM = gMain || (stringMain ? stringMain.gauge : G0);
    const dC = gCross || (stringCross ? stringCross.gauge : G0);
    const kMain = sMain * Math.pow(dM / G0, 2) * tMain;
    const kCross = sCross * Math.pow(dC / G0, 2) * tCross;
    // the mains carry most of the deflection, so they dominate the feel
    const k = 0.6 * kMain + 0.4 * kCross;
    /* The offset is where the scale SITS, and it was eight points too low.
     *
     * The bands below are set on the scale a stringer already knows -- the one
     * a Beers ERT or an RDC prints, where a soft gut bed reads in the mid 20s,
     * a club setup low 30s, and a fresh poly at reference high 30s. The curve
     * here had the right shape but started too low, so the whole catalogue
     * collapsed into the bottom two labels: across every frame, every string
     * at its own gauge and every tension inside that frame's own printed
     * range, 73% of setups read "Soft" and "Stiff" was unreachable. A full
     * polyester bed at the TOP of the recommended range came out "Soft" --
     * while the glossary two panels away calls polyester stiff and hard on the
     * arm. The app was contradicting itself on the one number a beginner would
     * use to decide whether a setup will hurt.
     *
     * Only the offset moved. The slope, the openness term and the head-size
     * term all behaved correctly -- they were putting the right DISTANCE
     * between two setups, just centred on the wrong number. */
    const dt = 16.5 + 0.42 * (k / 200) * (13.2 / openness) * (95 / headSqIn);

    // weight of string actually in the bed (not the tails): area x length x density
    const area = d => Math.PI * (d / 2) * (d / 2);              // mm²
    const mm3ToG = (mm3, dens) => (mm3 / 1000) * dens;          // mm³ -> cm³ -> g
    const weightG = mm3ToG(area(dM) * bed.mainLenMm, (stringMain && stringMain.density) || 1.3)
                  + mm3ToG(area(dC) * bed.crossLenMm, (stringCross && stringCross.density) || 1.3);

    let feel;
    if (dt < 30) feel = 'Soft';
    else if (dt < 36) feel = 'Comfortable';
    else if (dt < 42) feel = 'Firm';
    else feel = 'Stiff';

    return {
      mainM, crossM, totalM, totalFt: totalM * 3.28084,
      density, mainGap: bed.mainGap, crossGap: bed.crossGap, openness,
      dt, feel, weightG, gaugeMm: (dM + dC) / 2
    };
  }

  return { makeHoop, hoopFor, pathFrom, parsePattern, buildStringbed, stats };
})();
