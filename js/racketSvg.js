/* Draws the racket as a single SVG string, in millimetres, from the hoop
 * model in geometry.js. Both halves of the frame come from mirrored maths,
 * so it cannot come out lopsided.
 *
 * Proportions follow a real frame: 27 in overall, the hoop widest slightly
 * above its middle, a beam that thins toward the tip, a grommet strip inside
 * the beam, and a teardrop throat opening running into a tapered handle.
 */
const RacketSVG = (function () {

  const THROAT = 99;     // hoop bottom -> top of the shaft (mm)
  const PALLET = 30;     // shaft -> grip transition (mm)
  const GRIP = 215;      // grip length (mm)
  const GRIP_W = 30;     // grip width (mm)

  /* True-to-scale string is ~1.5 px on screen, which makes every gauge look
   * the same. Widths are drawn with the difference from 1.25 mm amplified. */
  const drawGauge = g => g * 1.35 + (g - 1.25) * 2.2;

  /* Every racket on the page is a separate inline SVG, but fragment IDs are
   * DOCUMENT-scoped: two SVGs both defining "frameMask" means url(#frameMask)
   * resolves to whichever came first. The guide's full racket was picking up
   * the bench view's head-crop mask and vanishing. Each render gets its own
   * suffix on every id and reference. */
  /* EVERY id defined in here must be listed. A page can hold several of these
     at once -- the bench racket, the guide's mini racket, the throat close-up --
     and an id that is not localised is shared with whichever of them rendered
     first. A clip is geometry: borrowing another frame's means the arm is cut
     against the wrong outline, which is how a sharp wedge appeared across the
     throat of the guide's racket while the same code looked right on its own. */
  const DEF_IDS = ['frameGrad', 'carbon', 'paint', 'sheen', 'gripGrad', 'shaftGrad', 'bedGlow', 'soft',
                   'stringShadow', 'bedClip', 'gripClip', 'fadeGrad', 'frameMask', 'pullArrow',
                   'frameClip', 'armClip', 'armEdgeMask', 'armLift', 'rimLight'];
  let renderSeq = 0;
  function localiseIds(svg, uid) {
    DEF_IDS.forEach(id => {
      svg = svg.split(`id="${id}"`).join(`id="${id}-${uid}"`)
               .split(`url(#${id})`).join(`url(#${id}-${uid})`);
    });
    return svg;
  }

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f = v => (Math.round(v * 100) / 100);
  const P = (pts, open) => Geo.pathFrom(pts, open);

  /* Beam thickness around the hoop: thinner over the tip, thickest at the
   * shoulders and into the yoke, like a modern tapered-beam frame. Scaled by
   * the frame's own beam width, so a 24.5 mm Clash is visibly chunkier than a
   * 18.5 mm Phantom. */
  const beamFor = mm => {
    const base = 12.9 * ((mm || 22) / 22);
    // A strong bottom bias reads as bulk, not as taper: it fattens the beam
    // exactly where the hoop is already turning into the throat, which is what
    // made 5 and 7 o'clock heavy. Enough of it left to keep a visible taper
    // from the yoke to the tip, and no more.
    return t => base * (1 + 0.09 * Math.sin(t) + 0.07 * Math.abs(Math.cos(t)));
  };

  function render(o) {
    const r = o.racket, bed = o.bed, th = r.theme, H = bed.hoop;
    /* Frame paint and instruction are different jobs and, since rackets.js
       started deriving them, different colours -- see the note there. Nothing
       drawn on the frame may use `ink`, and nothing instructional may use
       `paintInk`, or a marker goes invisible on the racket it belongs to. */
    const paintInk = th.paintAccent || th.accent;
    const ink = th.instructionAccent || th.accent;
    const ink2 = th.instructionInk || th.accent2;
    const beam = beamFor(r.beamMm);
    const a = H.a, bT = H.bT, bB = H.bB;

    const mainColor = o.mainColor, crossColor = o.crossColor;
    const gM = drawGauge(o.mainGauge), gC = drawGauge(o.crossGauge);

    const headTop = -(bT + beam(1.5 * Math.PI));
    const hoopBottom = bB + beam(0.5 * Math.PI);
    const shaftTop = hoopBottom + THROAT;
    const gripTop = shaftTop + PALLET;
    const buttEnd = gripTop + GRIP;

    // ---- viewBox: the bench view is all head, the full view is the racket --
    const headOnly = o.crop === 'head';
    // A FIXED reference frame, identical for every racket, so a 107 in² head
    // actually renders bigger than a 97 instead of each one being scaled to
    // fill its own box.
    /* The mounting rig reaches outside the hoop, so it gets a bigger reference
       box. Everything else keeps the fixed one, where a 107 in? head really
       does render larger than a 97. */
    const RIG = !!o.mountRig;
    const REF_HALF_W = RIG ? 192 : 146, REF_TOP = RIG ? -236 : -208;
    const yokeView = o.crop === 'yoke';
    const SQ = 0.52;                       // vertical squash = looking along the frame
    // the beat stills show the hanging slack, so they need more room below
    const beatView = !!(o.startBeat || o.stepIndex);
    const bot = headOnly ? hoopBottom + THROAT * (beatView ? 0.55 : 0.42) : 566;
    // the stepped views put a gripper and its pull arrow outside the hoop, so
    // they need headroom the plain view does not
    const topY = REF_TOP - (beatView ? 26 : 0);
    let vb = [-REF_HALF_W, topY, 2 * REF_HALF_W,
              (headOnly ? (RIG ? 250 : (beatView ? 206 : 208)) : 566) - topY];
    if (yokeView) {
      // padded on every side: the close-up was reading as cramped
      const y0 = bB * 0.34, y1 = bB + THROAT * 0.78;
      const padY = 26;
      vb = [-a * 0.96, y0 * SQ - padY, a * 1.92, (y1 - y0) * SQ + padY * 2];
    }
    /* Head sizes a few square inches apart differ by only a few percent in
       width, which reads as "the same racket". So the drawing (only the
       drawing, never the numbers) sets how much of the box the head fills
       from its size: a 100 fills about 93%, every square inch below that
       costs 1.5 points, and bigger heads grow but ease off so even an
       oversize frame stays inside the box. */
    if (!yokeView) {
      const A = r.headSize || 100;
      const fill = A <= 100 ? 0.93 - 0.015 * (100 - A)
                            : 0.93 + 0.05 * (1 - Math.exp(-(A - 100) / 6));
      const real = 0.952 * Math.sqrt(A / 100);   // what the true size fills
      const m = real / Math.max(0.6, fill);
      vb = vb.map(v => v * m);
    }

    // ---- outlines ----------------------------------------------------------
    const innerPts = H.outline(0, 360);
    const outerPts = H.outline(beam, 360);
    const inner = P(innerPts), outer = P(outerPts);
    const stripPts = H.outline(t => beam(t) * 0.30, 360);

    // ---- throat arms ------------------------------------------------------
    // Each arm is built from a CENTRELINE with an explicit width that tapers
    // from the hoop down to the shaft, rather than from two independent
    // curves -- otherwise the gap between those curves necks wherever they
    // happen to converge, which is what made the arms pinch at the top.
    const sw = GRIP_W / 2;
    // The yoke has to hold exactly the frame's stated number of hole sets, so
    // the arms attach just outside the last one -- a 3-set frame gets a
    // narrower yoke than a 4-set frame, which is what you see on a real racket.
    const sets = o.throatPairs || r.throatPairs || 3;
    const wTop = beam(0.5 * Math.PI) * 1.17;   // wide where it leaves the hoop
    const wBot = GRIP_W * 0.40;                // narrow at the shaft
    const armEndY = shaftTop + 12;

    // Where the arm meets the hoop decides whether the two read as one moulded
    // piece. Low on the bottom arc the hoop's outer curve is nearly HORIZONTAL,
    // so an arm leaving there and running down must turn a corner -- that
    // corner is the seam. Attach high enough that the hoop's own tangent is
    // already steep, and the arm can leave along it with no turn at all.
    // Still outside the last yoke hole set, so a 4-set frame keeps a wider yoke.
    // Far out on the hoop the arms have to splay to reach the shaft, which is
    // what made the throat opening read as a wide triangle. Closer in, they
    // run nearly parallel for most of their length, the way a modern frame's
    // do -- still outside the last yoke hole set.
    const xArm = Math.max(sets * bed.mainGap + wTop * 0.62, 0.73 * a);
    const tArm = H.tAtX(Math.min(0.93 * a, xArm), true);
    // The arm's half-width is measured along ITS OWN normal, and it leaves
    // along the hoop's tangent, so that normal IS the hoop's normal here:
    // dropping the centreline by half a width puts the arm's outer edge
    // exactly on the hoop's outer edge. Flush, with nothing proud of it.
    const attach = H.offset(tArm, t => beam(t) - wTop / 2);
    const tanArm = (() => {
      const e = 0.012;
      const p1 = H.offset(tArm - e, beam), p2 = H.offset(tArm + e, beam);
      const d = [p2[0] - p1[0], p2[1] - p1[1]], L = Math.hypot(d[0], d[1]) || 1;
      return [d[0] / L, d[1] / L];
    })();

    function armPath(side) {
      // Leave along the hoop's TRUE tangent -- not a flattened one. A flattened
      // tangent is a kink, and a kink under a fill of the same colour still
      // reads as two pieces because the silhouette breaks.
      const T = [side * -Math.abs(tanArm[0]), Math.abs(tanArm[1])];
      const S = [side * Math.abs(attach[0]), attach[1]];
      const P0 = [S[0] - T[0] * 30, S[1] - T[1] * 30];    // tuck up under the hoop
      // A long first handle holds the departure tangent, so curvature builds
      // gradually instead of all at the join.
      const P1 = [S[0] + T[0] * THROAT * 0.78, S[1] + T[1] * THROAT * 0.78];
      const P2 = [side * GRIP_W * 0.46, armEndY - THROAT * 0.30];
      const P3 = [side * GRIP_W * 0.24, armEndY];
      const N = 96, L = [], R = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, v = 1 - u;
        const B = [
          v * v * v * P0[0] + 3 * v * v * u * P1[0] + 3 * v * u * u * P2[0] + u * u * u * P3[0],
          v * v * v * P0[1] + 3 * v * v * u * P1[1] + 3 * v * u * u * P2[1] + u * u * u * P3[1]
        ];
        const D = [
          3 * v * v * (P1[0] - P0[0]) + 6 * v * u * (P2[0] - P1[0]) + 3 * u * u * (P3[0] - P2[0]),
          3 * v * v * (P1[1] - P0[1]) + 6 * v * u * (P2[1] - P1[1]) + 3 * u * u * (P3[1] - P2[1])
        ];
        const dl = Math.hypot(D[0], D[1]) || 1;
        const n = [-D[1] / dl, D[0] / dl];
        // Hold the full width through the join, then taper: a width that starts
        // shrinking at the hoop pinches the arm right where it should be
        // thickest, which is the other thing that made it look stuck on.
        const e = Math.max(0, (u - 0.22) / 0.78);
        const w = (wTop + (wBot - wTop) * (e * e * (3 - 2 * e))) / 2;
        L.push([B[0] + n[0] * w, B[1] + n[1] * w]);
        R.push([B[0] - n[0] * w, B[1] - n[1] * w]);
      }
      // Which rail is the INNER one depends on the sweep direction, so pick it
      // by position rather than by trusting the sign of the normal.
      const inward = Math.abs(L[N][0]) + Math.abs(L[Math.round(N * 0.6)][0])
                   < Math.abs(R[N][0]) + Math.abs(R[Math.round(N * 0.6)][0]) ? L : R;
      const outward = (inward === L ? R : L).slice();
      const d = P(L.concat(R.reverse()));
      return { d: d, inner: inward.slice(), outer: outward };
    }
    const armR = armPath(1), armL = armPath(-1);
    const arms = armR.d + ' ' + armL.d;

    // Where the arm's inner edge leaves the hoop is the crotch of the throat --
    // the corner the yoke's bottom edge has to stop at, and the corner a real
    // moulded frame carries a radius through.
    const outsideHoop = q => {
      const c = H.offset(H.tAtPoint(q[0], q[1]), beam);
      return Math.hypot(q[0], q[1]) > Math.hypot(c[0], c[1]);
    };
    const crotch = (() => {
      const pts = armR.inner;
      for (let i = 1; i < pts.length; i++)
        if (outsideHoop(pts[i])) return { p: pts[i], i: i };
      return { p: pts[0], i: 0 };
    })();
    const tCrotch = H.tAtPoint(crotch.p[0], crotch.p[1]);

    // The crotch gets a radius, as a moulded frame does: the arm's inner edge
    // and the yoke's bottom edge stop short of the corner and a tangent arc
    // carries between them. Both the FILL and the OUTLINE have to follow it --
    // filling the corner but still stroking the sharp V over the top just draws
    // the corner back on.
    const FIL = wTop * 0.85;
    const armStep = (() => {
      const q = armR.inner;
      return Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) || 1;
    })();
    const iFil = Math.min(armR.inner.length - 1, crotch.i + Math.round(FIL / armStep));
    const tFil = tCrotch + (FIL / Math.hypot(a, bB)) * 1.7;
    const filPts = side => {
      const A0 = armR.inner[iFil], B0 = H.offset(tFil, beam);
      return {
        A: [side * Math.abs(A0[0]), A0[1]],
        B: [side * Math.abs(B0[0]), B0[1]],
        C: [side * Math.abs(crotch.p[0]), crotch.p[1]]
      };
    };
    // Fill: a closed region whose only free edge is the arc. It deliberately
    // reaches BACK inside the hoop before closing, because the crotch point is
    // found on a sampled rail and sits a hair off the true outer curve -- close
    // the region at the corner itself and that hair shows as a lit needle of
    // background poking out of the throat.
    const filletFill = side => {
      const q = filPts(side);
      const back = Math.max(0, crotch.i - 10);
      const pts = [];
      for (let k = back; k <= iFil; k++)
        pts.push([side * Math.abs(armR.inner[k][0]), armR.inner[k][1]]);
      for (let k = 1; k <= 24; k++) {            // the arc, A -> B
        const u = k / 24, v = 1 - u;
        pts.push([v * v * q.A[0] + 2 * v * u * q.C[0] + u * u * q.B[0],
                  v * v * q.A[1] + 2 * v * u * q.C[1] + u * u * q.B[1]]);
      }
      const tBack = H.tAtPoint(armR.inner[back][0], armR.inner[back][1]);
      const along = H.sweep(tFil, tBack, beam, 40);
      along.forEach(w => pts.push([side * Math.abs(w[0]), w[1]]));
      return P(pts);
    };
    // outline: only the arc, tangent to both edges at A and B
    const filletEdge = side => {
      const q = filPts(side);
      return `M${f(q.A[0])},${f(q.A[1])} Q${f(q.C[0])},${f(q.C[1])} ${f(q.B[0])},${f(q.B[1])}`;
    };
    const fillets = filletFill(1) + ' ' + filletFill(-1);

    /* The frame's outline is one continuous silhouette, so it is stroked as the
     * runs that actually make it up -- never as whole closed shapes that would
     * cross each other's faces. */
    const railEdge = (rail, from, side) => P(rail.slice(from)
      .map(q => [side * Math.abs(q[0]), q[1]]), true);

    const p = [];
    /* width/height as well as the viewBox. On the page the stylesheet sizes
       this and they are ignored, but the SAME markup is what the PNG export
       feeds to an <img> -- and an SVG with no intrinsic size has no reliable
       cross-browser answer for how big it is. Chrome infers it from the
       explicit drawImage dimensions; Firefox does not, and rasterises nothing.
       Two attributes make the exported file self-describing. */
    p.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vb[0])} ${f(vb[1])} ${f(vb[2])} ${f(vb[3])}" width="${f(vb[2])}" height="${f(vb[3])}" class="racket-svg${o.animate ? ' animating' : ''}" role="img" aria-label="${esc(r.brand + ' ' + r.model + ' strung ' + bed.patternLabel)}">`);

    // ---------------- defs ----------------
    p.push('<defs>');
    // objectBoundingBox units restart the gradient in EVERY path's own box, so
    // the arms were lit as if they were separate objects -- a bright core and
    // two dark edges of their own, ending abruptly at the hoop. One gradient in
    // frame coordinates lights the whole frame as one piece.
    p.push(`<linearGradient id="frameGrad" gradientUnits="userSpaceOnUse"
      x1="${f(-(a + beam(0)))}" y1="0" x2="${f(a + beam(0))}" y2="0">
      <stop offset="0%" stop-color="${th.frameEdge}"/>
      <stop offset="13%" stop-color="${th.frameA}"/>
      <stop offset="44%" stop-color="${th.frameB}"/>
      <stop offset="78%" stop-color="${th.frameA}"/>
      <stop offset="100%" stop-color="${th.frameEdge}"/></linearGradient>`);
    /* The accent is also the colour every instructional mark is drawn in, so
       it can only ever TINT the frame. Wash the whole tip in it and a light
       frame reads as painted in the highlight colour -- which is both a
       manufacturer's colour-blocking and the one thing that must stay
       readable ON the frame. Kept to a hint at the tip and the yoke. */
    /* The rails are painted in frameEdge, which on a dark frame is near black
       -- correct as shading, and invisible standing against a dark page. A
       lacquered beam does not actually go black at the silhouette: the roll of
       the edge catches a specular the flat of the face never does. So a narrow
       highlight rides the outermost few millimetres on each side, stronger on
       the shadow side where there is nothing else to separate the frame. It
       reaches zero well before the face, so nothing goes grey, and it is only
       ever at 3 and 9 o'clock -- where the silhouette runs vertical and is
       hardest to pick out -- because the tip and yoke are at x near zero. */
    p.push(`<linearGradient id="rimLight" gradientUnits="userSpaceOnUse"
      x1="${f(-(a + beam(0)))}" y1="0" x2="${f(a + beam(0))}" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="6%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="93%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0.38"/></linearGradient>`);
    p.push(`<linearGradient id="paint" gradientUnits="userSpaceOnUse"
      x1="0" y1="${f(headTop)}" x2="0" y2="${f(shaftTop + 30)}">
      <stop offset="0%" stop-color="${paintInk}" stop-opacity="0.34"/>
      <stop offset="16%" stop-color="${paintInk}" stop-opacity="0.05"/>
      <stop offset="62%" stop-color="${paintInk}" stop-opacity="0"/>
      <stop offset="88%" stop-color="${paintInk}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${paintInk}" stop-opacity="0.20"/></linearGradient>`);
    /* Painted graphite, not moulded plastic: a broad white sheen over the
       whole frame is what made it look translucent. A narrow specular near
       the light and a long shadow into the far side reads as a matte lacquer
       over carbon. The shadow side used to run almost to black, which is fine
       on its own and invisible against a dark background -- a lacquered round
       section picks up a dim return off whatever it is standing in, so the
       far edge lifts again at the end. That return is what lets the whole
       silhouette be read at a glance without an outline or a glow. */
    p.push(`<linearGradient id="sheen" gradientUnits="userSpaceOnUse"
      x1="${f(-a * 1.05)}" y1="${f(headTop)}" x2="${f(a * 0.95)}" y2="${f(shaftTop)}">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.17"/>
      <stop offset="15%" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="45%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="76%" stop-color="#000" stop-opacity="0.20"/>
      <stop offset="92%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0.09"/></linearGradient>`);
    /* A woven twill, far too fine to read as a pattern at this size -- it just
       stops the frame's faces being perfectly flat colour, the way a clear
       coat over carbon never quite is. In user space, so the weave runs
       continuously across the hoop and the arms instead of restarting in each
       path's own box. */
    p.push(`<pattern id="carbon" patternUnits="userSpaceOnUse" width="5" height="5"
      patternTransform="rotate(38)">
      <rect width="5" height="5" fill="#000" fill-opacity="0.025"/>
      <path d="M0,1.25 H5 M0,3.75 H5" stroke="#fff" stroke-opacity="0.022" stroke-width="1"/>
      <path d="M1.25,0 V5 M3.75,0 V5" stroke="#000" stroke-opacity="0.032" stroke-width="1"/>
    </pattern>`);
    p.push(`<linearGradient id="shaftGrad" gradientUnits="userSpaceOnUse"
      x1="${f(-sw)}" y1="0" x2="${f(sw)}" y2="0">
      <stop offset="0%" stop-color="${th.frameEdge}"/>
      <stop offset="18%" stop-color="${th.frameA}"/>
      <stop offset="52%" stop-color="${th.frameB}"/>
      <stop offset="86%" stop-color="${th.frameA}"/>
      <stop offset="100%" stop-color="${th.frameEdge}"/></linearGradient>`);
    p.push(`<linearGradient id="gripGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.9"/>
      <stop offset="28%" stop-color="${th.grip}"/>
      <stop offset="60%" stop-color="${th.grip}"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.9"/></linearGradient>`);
    p.push(`<radialGradient id="bedGlow" cx="50%" cy="44%" r="62%">
      <stop offset="0%" stop-color="${paintInk}" stop-opacity="0.07"/>
      <stop offset="72%" stop-color="${paintInk}" stop-opacity="0.01"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>`);
    p.push(`<linearGradient id="armLift" gradientUnits="userSpaceOnUse"
      x1="0" y1="${f(bB)}" x2="0" y2="${f(armEndY)}">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="42%" stop-color="#fff" stop-opacity="0.075"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0.09"/></linearGradient>`);
    p.push(`<filter id="soft" x="-30%" y="-25%" width="160%" height="165%">
      <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#000" flood-opacity="0.48"/></filter>`);
    p.push(`<filter id="stringShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="1.3" stdDeviation="0.9" flood-color="#000" flood-opacity="0.5"/></filter>`);
    p.push(`<clipPath id="bedClip"><path d="${inner}"/></clipPath>`);
    /* The grommet ridges are struck along the frame normal by a fraction of the
       beam, which overshoots wherever the hole does not sit exactly on the
       inner edge -- so they broke the outer silhouette all round the hoop and
       poked out of the throat arms at the join. Clipping to the frame band is
       exact, where tuning the fraction would only move the overshoot around. */
    p.push(`<clipPath id="frameClip"><path d="${outer}"/></clipPath>`);
    /* The arm leaves along the hoop's tangent at the attach point and is tucked
       back up under the hoop from there, and it keeps a straight tangent for a
       stretch below the join while the hoop curves away from it. Either side of
       the join that left a thin tab of arm standing proud of the silhouette.
       Above the attach point the arm is tucked under the hoop, so the only
       place it may paint there is the frame BAND -- the ring between the inner
       and outer outlines, which the hoop is painted over the top of anyway.
       Clipping that stretch to the outer outline alone was not enough: the
       tuck also reached PAST THE INNER EDGE into the string bed, where nothing
       paints over it, and stood there as a wedge with a sharp diagonal cutting
       across the frame. Below the attach point the arm is its own shape and
       must not be clipped to the hoop at all -- the outline narrows toward the
       throat while the arms stay wide, so clipping the whole length to it
       shears the arms off. Clip = the band (evenodd) OR anything below the
       join; children of a clipPath union, so the two combine. */
    p.push(`<clipPath id="armClip">
      <path d="${outer} ${inner}" clip-rule="evenodd"/>
      <rect x="${f(-REF_HALF_W)}" y="${f(attach[1])}"
            width="${f(2 * REF_HALF_W)}" height="${f(1200)}"/></clipPath>`);
    /* The arm's OUTLINE is a different problem from its fill. The fill under
       the hoop is harmless -- the hoop is painted over it in the same colours.
       The outline is not: the hoop is painted in layered, part-transparent
       coats, so a stroke underneath shows THROUGH the frame as a hard diagonal
       running across the band with a corner where the fillet meets it. That is
       the sharp edge cutting into the frame. An outline belongs only where the
       arm is actually the silhouette -- outside the hoop, below the join -- so
       mask the hoop out of it entirely. */
    p.push(`<mask id="armEdgeMask" maskUnits="userSpaceOnUse"
             x="${f(-REF_HALF_W)}" y="${f(attach[1])}"
             width="${f(2 * REF_HALF_W)}" height="${f(1200)}">
      <rect x="${f(-REF_HALF_W)}" y="${f(attach[1])}"
            width="${f(2 * REF_HALF_W)}" height="${f(1200)}" fill="#fff"/>
      <path d="${outer}" fill="#000"/></mask>`);
    p.push(`<clipPath id="gripClip"><rect x="${f(-sw - 2.4)}" y="${f(gripTop)}"
      width="${f(GRIP_W + 4.8)}" height="${f(buttEnd - gripTop)}" rx="6"/></clipPath>`);
    const fadeFrom = hoopBottom + THROAT * (beatView ? 0.34 : 0.2);
    p.push(`<linearGradient id="fadeGrad" gradientUnits="userSpaceOnUse"
        x1="0" y1="${f(fadeFrom)}" x2="0" y2="${f(bot)}">
        <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="frameMask">
        <rect x="-500" y="-700" width="1000" height="${f(headOnly ? fadeFrom + 700 : 1600)}" fill="#fff"/>
        ${headOnly ? `<rect x="-500" y="${f(fadeFrom)}" width="1000"
          height="${f(bot - fadeFrom)}" fill="url(#fadeGrad)"/>` : ''}
        <path d="${inner}" fill="#000"/>
      </mask>`);
    p.push(`<marker id="pullArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4"
      orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${ink}"/></marker>`);
    p.push('</defs>');

    /* ---------------- six-point mounting system ----------------
       Six pads on their own is a picture of six clips stuck to a racket. What
       makes it read as a MACHINE is that they all belong to one thing: a pair
       of rails outside the hoop, tied together top and bottom, standing on a
       turntable, with six adjustable arms reaching in off them. So the rig is
       built in two layers -- the rails and the platform go BEHIND the racket,
       the arms and pads in FRONT -- which is also what puts the racket in the
       middle of the machine rather than on top of it.

       Positions follow a real six-point system rather than six evenly spaced
       clips: one primary support square on at the head, one at the throat, and
       four angled shoulder arms bracing the sides. Every contact is on the
       frame's own outer curve, so nothing can reach the stringbed. */
    const rig = (() => {
      if (!o.mountRig) return null;
      const RAIL_X = 176, TOP_Y = -206, BOT_Y = 214, DECK_Y = 228;
      const STEEL = '#22272e', LIT = '#3d444d', ARM = '#474f59',
            PIVOT = '#6e7883', PAD = '#828c98', RUBBER = '#14181d';

      const bar = (x, y, w, h, r) =>
        `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}" fill="${STEEL}"/>
         <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="3" rx="1.5" fill="${LIT}"/>`;

      const back =
        // the turntable the whole thing stands on, seen almost edge on
        `<ellipse cx="0" cy="${DECK_Y}" rx="158" ry="13" fill="${STEEL}"/>
         <ellipse cx="0" cy="${DECK_Y - 3}" rx="158" ry="13" fill="${LIT}" fill-opacity="0.5"/>`
        + bar(-RAIL_X - 5, TOP_Y, 10, BOT_Y - TOP_Y, 5)      // left rail
        + bar(RAIL_X - 5, TOP_Y, 10, BOT_Y - TOP_Y, 5)       // right rail
        + bar(-RAIL_X, TOP_Y - 5, 2 * RAIL_X, 10, 5)         // head cross member
        + bar(-RAIL_X, BOT_Y - 5, 2 * RAIL_X, 10, 5);        // throat cross member

      /* one primary support at 12 and at 6, four shoulder arms between */
      const posts = [
        [1.5 * Math.PI, 1, 'v'], [-0.92, 2, 'h'], [0.80, 3, 'h'],
        [0.5 * Math.PI, 4, 'v'], [Math.PI - 0.80, 5, 'h'], [Math.PI + 0.92, 6, 'h']
      ];
      let front = '';
      posts.forEach(([t, n, kind]) => {
        const C = H.offset(t, beam);
        const b0 = H.pt(t), nm = H.normal(b0[0], b0[1]);
        const tg = [-nm[1], nm[0]];
        const at = (d, s) => [C[0] + nm[0] * d + tg[0] * (s || 0),
                              C[1] + nm[1] * d + tg[1] * (s || 0)];
        const pad = at(8), piv = at(30);
        // the long member runs back to the rail it is mounted on; a vertical
        // support runs to the cross member instead, which is what makes the
        // head and throat posts read as the primary pair
        const anchor = kind === 'v'
          ? [piv[0], nm[1] < 0 ? -206 : 214]
          : [(C[0] < 0 ? -176 : 176), piv[1]];
        const ang = f(Math.atan2(nm[1], nm[0]) * 180 / Math.PI);
        front += `<line x1="${f(anchor[0])}" y1="${f(anchor[1])}" x2="${f(piv[0])}" y2="${f(piv[1])}"
            stroke="${ARM}" stroke-width="9" stroke-linecap="round"/>
          <line x1="${f(anchor[0])}" y1="${f(anchor[1])}" x2="${f(piv[0])}" y2="${f(piv[1])}"
            stroke="#ffffff" stroke-opacity="0.10" stroke-width="3" stroke-linecap="round"/>
          <line x1="${f(piv[0])}" y1="${f(piv[1])}" x2="${f(pad[0])}" y2="${f(pad[1])}"
            stroke="${ARM}" stroke-width="8" stroke-linecap="round"/>
          <circle cx="${f(piv[0])}" cy="${f(piv[1])}" r="6.5" fill="${PIVOT}"/>
          <circle cx="${f(piv[0])}" cy="${f(piv[1])}" r="2.4" fill="${RUBBER}"/>
          <g transform="translate(${f(pad[0])} ${f(pad[1])}) rotate(${ang})">
            <path d="M0,-13 A13,13 0 0 1 0,13" fill="none" stroke="${PAD}"
              stroke-width="7" stroke-linecap="round"/>
            <path d="M-3.5,-11 A11,11 0 0 1 -3.5,11" fill="none" stroke="${RUBBER}"
              stroke-width="3.2" stroke-linecap="round"/>
          </g>`;
        // the number belongs at the CONTACT, beside the pad, not out on the arm
        const bg = at(7, 21);
        front += `<circle cx="${f(bg[0])}" cy="${f(bg[1])}" r="8" fill="#0d1013"
            stroke="${ink}" stroke-width="1.4"/>
          <text x="${f(bg[0])}" y="${f(bg[1] + 3.4)}" text-anchor="middle" font-size="10"
            font-weight="800" font-family="Inter, Helvetica, Arial, sans-serif"
            fill="${ink}">${n}</text>`;
      });
      return { back: `<g class="mount-deck">${back}</g>`,
               front: `<g class="mount-rig">${front}</g>` };
    })();
    if (rig) p.push(rig.back);

    if (yokeView) p.push(`<g transform="scale(1 ${SQ})">`);
    p.push('<g filter="url(#soft)" mask="url(#frameMask)">');

    // ---------------- handle ----------------
    if (!headOnly) {
      p.push(`<path d="M${f(-sw + 2)},${f(shaftTop - 6)} L${f(sw - 2)},${f(shaftTop - 6)}
        L${f(sw)},${f(gripTop + 8)} L${f(-sw)},${f(gripTop + 8)} Z" fill="url(#shaftGrad)"/>`);
      p.push(`<path d="M${f(-sw)},${f(gripTop)} L${f(sw)},${f(gripTop)}
        L${f(sw + 2.2)},${f(buttEnd - 8)} Q${f(sw + 2.2)},${f(buttEnd - 1)} ${f(sw - 3)},${f(buttEnd - 1)}
        L${f(-sw + 3)},${f(buttEnd - 1)} Q${f(-sw - 2.2)},${f(buttEnd - 1)} ${f(-sw - 2.2)},${f(buttEnd - 8)} Z"
        fill="url(#gripGrad)"/>`);
      let wraps = '';
      for (let y = gripTop + 13; y < buttEnd - 10; y += 12.5)
        wraps += `<path d="M${f(-sw - 3)},${f(y)} L${f(sw + 3)},${f(y - 8.6)}" stroke="#fff" stroke-opacity="0.08" stroke-width="3"/>`;
      p.push(`<g clip-path="url(#gripClip)">${wraps}</g>`);
      p.push(`<rect x="${f(-sw - 4.5)}" y="${f(buttEnd - 14)}" width="${f(GRIP_W + 9)}" height="17" rx="5" fill="${th.frameEdge}"/>`);
      p.push(`<rect x="${f(-7)}" y="${f(buttEnd - 9)}" width="14" height="7" rx="2" fill="${paintInk}" fill-opacity="0.9"/>`);
    }

    // ---------------- frame ----------------
    // arms first, then the hoop ring over them: identical fills, so the join
    // under the yoke is invisible and there is no seam to stroke
    // Two overlapping discs per side bridge the corner where the arm meets the
    // hoop, so the join reads as a moulded radius rather than a mitred edge.
    // A generous rounded join on the arm outline is what softens the corner
    // where it meets the hoop -- fillet discs were showing as visible circles
    // wherever they reached past the arm into the throat opening.
    p.push(`<g clip-path="url(#armClip)">`);
    ['url(#frameGrad)', 'url(#carbon)', 'url(#paint)', 'url(#sheen)', 'url(#rimLight)'].forEach(fill => {
      // separate elements, not one path: the fillet overlaps the arm, and under
      // the nonzero rule two overlapping subpaths of opposite winding cancel --
      // which punched a hairline of background straight through the crotch
      p.push(`<path d="${arms}" fill="${fill}" stroke="${fill}" stroke-width="1.2"
        stroke-linejoin="round" stroke-linecap="round"/>`);
      p.push(`<path d="${fillets}" fill="${fill}" stroke="${fill}" stroke-width="1.2"
        stroke-linejoin="round" stroke-linecap="round"/>`);
    });
    /* On the darkest palettes the arms were falling into the background: they
       sit at the frame gradient's mid tone, and the mid tone of a near-black
       frame is near-black. A flat lift of about a tenth raises only the arms
       -- the clip keeps it off the hoop, and the edge strokes below are drawn
       over the top, so the graphite rails stay dark and the faces do not go
       chalky. Faded to nothing where the arm leaves the hoop, or the lift is
       itself a seam at exactly the join the fillets exist to hide. */
    p.push(`<path d="${arms}" fill="url(#armLift)"/>`);
    p.push(`<path d="${fillets}" fill="url(#armLift)"/>`);
    // outline the arms HERE, before the hoop is painted over them -- drawn
    // afterwards, the outline of the tucked-under section runs across the yoke.
    // Same weight as the hoop's outer edge below, or the silhouette changes
    // thickness exactly at the join and gives the join away.
    p.push(`<g mask="url(#armEdgeMask)">`);
    [1, -1].forEach(side => {
      p.push(`<path d="${railEdge(armR.outer, 0, side)}" fill="none" stroke="${th.frameEdge}"
        stroke-opacity="0.8" stroke-width="1" stroke-linejoin="round"/>`);
      p.push(`<path d="${railEdge(armR.inner, iFil, side)}" fill="none" stroke="${th.frameEdge}"
        stroke-opacity="0.8" stroke-width="1" stroke-linejoin="round"/>`);
      p.push(`<path d="${filletEdge(side)}" fill="none" stroke="${th.frameEdge}"
        stroke-opacity="0.8" stroke-width="1"/>`);
    });
    p.push(`</g>`);
    p.push(`</g>`);
    const ring = `${outer} ${inner}`;
    ['url(#frameGrad)', 'url(#carbon)', 'url(#paint)', 'url(#sheen)', 'url(#rimLight)'].forEach(fill => {
      p.push(`<path d="${ring}" fill-rule="evenodd" fill="${fill}"/>`);
    });

    // grommet strip: the plastic band the strings actually pass through
    p.push(`<path d="${P(stripPts)}" fill="none" stroke="#0b0d11" stroke-opacity="0.24"
      stroke-width="${f(beam(0) * 0.52)}"/>`);
    p.push(`<path d="${inner}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="1.1"/>`);
    // The frame's outer edge is NOT a closed loop once the arms are on it: it
    // runs round the head and then leaves along the arms. Stroking the whole
    // ellipse drew that edge straight across the face of each arm -- a line
    // where the moulding is continuous, which is what read as two pieces.
    // What is left between the arms is the yoke's bottom edge, and it stops at
    // the crotch on each side.
    const edge = (t1, t2) => P(H.sweep(t1, t2, beam, 150), true);
    p.push(`<path d="${edge(tArm, -Math.PI - tArm)}" fill="none"
      stroke="${th.frameEdge}" stroke-opacity="0.8" stroke-width="1"/>`);
    p.push(`<path d="${edge(tFil, Math.PI - tFil)}" fill="none"
      stroke="${th.frameEdge}" stroke-opacity="0.8" stroke-width="1"/>`);
    /* Bumper guard over the tip. Drawn as a flat bright stroke it sat ON the
       frame like a lit overlay rather than being part of what the frame is
       painted in, so the same weave and the same light that fall on the rest
       of the hoop are struck over it in turn -- same path, same width. It ends
       up a shade of the frame's own paint rather than a lamp. */
    const bumper = P(H.sweep(Math.PI + 0.92, 2 * Math.PI - 0.92, t => beam(t) * 0.70, 90), true);
    const bumperW = f(beam(1.5 * Math.PI) * 0.46);
    // Enough accent to place the frame in its colour family, not enough to
    // read as a painted-on band -- on a light frame a strong one looked like
    // commercial colour blocking.
    const bumperO = o.highlightYoke ? 0.18 : 0.57;
    [`${paintInk}" stroke-opacity="${bumperO}`, 'url(#carbon)', 'url(#sheen)'].forEach(st => {
      p.push(`<path d="${bumper}" fill="none" stroke="${st}" stroke-width="${bumperW}"
        stroke-linecap="round"/>`);
    });

    // when the throat is what we are inspecting, light up the yoke instead
    if (o.highlightYoke) {
      const ty = H.tAtX(0.5 * a, true);
      const yoke = P(H.sweep(ty, Math.PI - ty, t => beam(t) * 0.68, 90), true);
      p.push(`<path d="${yoke}" fill="none" stroke="${ink}" stroke-opacity="0.20"
        stroke-width="${f(beam(0.5 * Math.PI) * 1.2)}" stroke-linecap="round"/>`);
      p.push(`<path d="${yoke}" fill="none" stroke="${ink}" stroke-opacity="0.6"
        stroke-width="${f(beam(0.5 * Math.PI) * 0.45)}" stroke-linecap="round"/>`);
    }
    p.push('</g>');

    // ---------------- stringbed ----------------
    p.push(`<g clip-path="url(#bedClip)"><rect x="${f(-a)}" y="${f(-bT)}" width="${f(2 * a)}" height="${f(bT + bB)}" fill="url(#bedGlow)"/></g>`);

    let overlay = '';                        // labels/clamps drawn last of all
    const stage = o.stage || 'done';          // empty | mains | crosses | done
    const showMains = stage !== 'empty';
    const showCrosses = stage === 'crosses' || stage === 'done';
    const centreOnly = stage === 'start';   // just the two centre mains

    const pace = o.pace || 0.045;            // seconds per string in the demo
    const clampGlyph = (x, y, dir, delay, still) => {
      const rot = dir === 'h' ? 90 : 0;
      return `<g class="${still ? 'clamp-still' : 'clamp'}" style="--d:${f(delay)}s"
        transform="translate(${f(x)} ${f(y)}) rotate(${rot})">
        <rect x="-6.1" y="-10.4" width="4.6" height="20" rx="1.7" fill="#c6ccd6" stroke="#1b2027" stroke-width="0.7"/>
        <rect x="1.5" y="-10.4" width="4.6" height="20" rx="1.7" fill="#a6aeba" stroke="#1b2027" stroke-width="0.7"/>
        <rect x="-5.2" y="-8.4" width="2.4" height="16" rx="1.2" fill="#eef1f5" fill-opacity="0.5"/>
      </g>`;
    };

    /* The loose end that has not been used yet. Real leftover is metres long,
     * so the drawn tail is capped and the true figure is labelled instead. */
    const tailGlyph = (x, y, dir, len, delay, still) =>
      `<path class="${still ? 'tail-still' : 'tail'}" style="--d:${f(delay)}s"
        d="M${f(x)},${f(y)} C${f(x + 16)},${f(y + dir * len * 0.32)} ${f(x - 20)},${f(y + dir * len * 0.66)} ${f(x + 7)},${f(y + dir * len)}"
        fill="none" stroke="${mainColor}" stroke-width="${f(gM)}" stroke-linecap="round" stroke-opacity="0.9"/>`;

    /* The bit people miss: between two mains the string crosses OUTSIDE the
     * frame, from the hole it just came out of to the next one along. */
    const routeGlyph = (pA, pB, delay) => {
      const nA = H.normal(pA[0], pA[1]), nB = H.normal(pB[0], pB[1]);
      const out = 13;
      const qA = [pA[0] + nA[0] * out * 0.5, pA[1] + nA[1] * out * 0.5];
      const qB = [pB[0] + nB[0] * out * 0.5, pB[1] + nB[1] * out * 0.5];
      const mx = (qA[0] + qB[0]) / 2 + (nA[0] + nB[0]) / 2 * out;
      const my = (qA[1] + qB[1]) / 2 + (nA[1] + nB[1]) / 2 * out;
      return `<path class="route" style="--d:${f(delay)}s"
        d="M${f(qA[0])},${f(qA[1])} Q${f(mx)},${f(my)} ${f(qB[0])},${f(qB[1])}"
        fill="none" stroke="${mainColor}" stroke-width="${f(gM)}" stroke-linecap="round"/>`;
    };
    const gripGlyph = (x, y, dir, delay, rot) =>
      `<g class="grip" style="--d:${f(delay)}s" transform="translate(${f(x)} ${f(y)}) rotate(${rot || 0})">
        <rect x="-7.5" y="-11" width="15" height="22" rx="3.5" fill="#4b525c"/>
        <rect x="-3.5" y="${dir > 0 ? -15 : 8}" width="7" height="7" rx="2" fill="#8d959f"/>
        <line x1="0" y1="${dir > 0 ? 12 : -12}" x2="0" y2="${dir > 0 ? 23 : -23}"
          stroke="${ink}" stroke-width="1.6" marker-end="url(#pullArrow)"/>
      </g>`;

    /* The order strings actually go in: centre pair first, then outwards,
     * alternating sides. Used by both the animation and the step-through. */
    const mainOrder = (() => {
      const mid = (bed.mains.length - 1) / 2;
      const L = bed.mains.filter(m => m.x < 0).sort((u, v) => v.x - u.x);
      const R = bed.mains.filter(m => m.x > 0).sort((u, v) => u.x - v.x);
      const out = [];
      for (let i = 0; i < Math.max(L.length, R.length); i++) {
        if (L[i]) out.push(L[i]);
        if (R[i]) out.push(R[i]);
      }
      return out;
    })();
    const rankOf = m => mainOrder.indexOf(m);
    const stepIdx = o.stepIndex || 0;          // 0 = play the whole thing

    const midMain = (bed.mains.length - 1) / 2;
    p.push(`<g class="strings" filter="url(#stringShadow)">`);

    if (showMains) {
      p.push('<g class="mains">');
      var clamps = [], tails = [];
      const beat = o.startBeat || 0;          // 0 = play the whole thing
      const into = 2.0;   // how far the string disappears into the grommet
      bed.mains.forEach(m => {
        const d = Math.abs(m.i - midMain);
        const centrePair = stage === 'mains' && d < 1;   // strung in the last step
        if (centreOnly && d > 0.6) return;
        if (stepIdx && stage === 'mains' && rankOf(m) >= stepIdx) return;
        // the beat stills draw both centre mains themselves, further down,
        // where the labels and the gripper that go with them are built
        if (beat) return;
        // In the demo the clamp goes on whichever end the tensioner is at, and
        // that end alternates: the string runs up one main, over, down the next.
        if (o.clampDemo && stage !== 'crosses' && !centrePair) {
          // which end the mains are anchored at is the PLAN's mainsStart, not a
      // hole count re-read here -- same fact, one owner
      const anchorBottom = (o.mainsStart || 'throat') === 'throat';
          const pulledTop = anchorBottom ? (Math.floor(d) % 2 === 0) : (Math.floor(d) % 2 === 1);
          const at = pulledTop ? m.top + 9 : m.bottom - 9;
          clamps.push([m.x, at, 'v', d * 2 * pace + pace * 1.15]);   // after the pull
          // leftover shrinks as the mains get used up
          const left = 1 - d / (bed.mains.length / 2);
          tails.push([m.x, pulledTop ? m.top - 3 : m.bottom + 3, pulledTop ? -1 : 1,
                      22 + 78 * Math.max(0, left), d * 2 * pace + pace * 0.5]);
        }
        p.push(`<line class="s-main${stage === 'crosses' || centrePair ? ' already-in' : ''}" x1="${f(m.x)}" y1="${f(m.top - into)}" x2="${f(m.x)}" y2="${f(m.bottom + into)}"
          stroke="${mainColor}" stroke-width="${f(gM)}" stroke-linecap="round" pathLength="100"
          style="--d:${f(d * 2 * pace)}s"/>`);
      });
      p.push('</g>');
    }
    if (showCrosses) {
      // The crosses start at the opposite end from the main tie-offs, so the
      // knots are not all crowded into one end of the frame.
      const nC = bed.crosses.length;
      const fromTop = o.crossFromTop !== false;
      const crossRank = c => fromTop ? c.j : (nC - 1 - c.j);
      p.push('<g class="crosses">');
      if (typeof clamps === 'undefined') { var clamps = [], tails = []; }
      var crossGrips = '';
      bed.crosses.forEach(c => {
        if (stepIdx && stage === 'crosses' && crossRank(c) >= stepIdx) return;
        p.push(`<line class="s-cross" x1="${f(c.left - 2.0)}" y1="${f(c.y)}" x2="${f(c.right + 2.0)}" y2="${f(c.y)}"
          stroke="${crossColor}" stroke-width="${f(gC)}" stroke-linecap="round" pathLength="100"
          style="--d:${f((o.clampDemo ? 0 : 0.75) + crossRank(c) * pace)}s"/>`);
        if (o.clampDemo) {
          const rank = crossRank(c);
          /* A cross is pulled AWAY from the side the string arrives on: it is
             fed in at the starting knot's side, woven across, and the gripper
             takes the far end. So the first cross is pulled to the opposite
             side from `crossStartSide`, and every cross after it alternates.
             Pulling it back out the side it went in was the animation showing
             the first cross being tensioned against its own knot. */
          const pulledRight = (rank % 2 === 0) !== ((o.crossStartSide || 1) > 0);
          clamps.push([pulledRight ? c.right - 9 : c.left + 9, c.y, 'h', rank * pace + pace * 1.15]);
          crossGrips += gripGlyph(pulledRight ? c.right + 27 : c.left - 27, c.y,
                                  pulledRight ? -1 : 1, rank * pace + pace * 0.3, 90);
        }
      });
      p.push('</g>');
    }
    const lastString = showCrosses ? bed.crosses.length * pace + 0.35 : bed.mains.length * pace + 0.35;
    if (o.weave && showMains && showCrosses) {
      const mh = Math.min(bed.crossGap * 0.34, gM * 2.2);   // main-over run
      const ch = gM * 1.5;                                            // shadow width
      p.push(`<g class="weave" style="--d:${f(lastString)}s${o.animate ? ';opacity:0' : ''}">`);
      bed.intersections.forEach(q => {
        if (stepIdx && stage === 'crosses') {
          const ci = bed.crosses.findIndex(c => c.y === q.y);
          const rank = (o.crossFromTop !== false) ? ci : bed.crosses.length - 1 - ci;
          if (rank >= stepIdx) return;
        }
        if (q.mainOver) {
          // the main passes over: redraw it, and shade the cross under it
          p.push(`<line x1="${f(q.x - ch)}" y1="${f(q.y)}" x2="${f(q.x + ch)}" y2="${f(q.y)}"
            stroke="#000" stroke-opacity="0.34" stroke-width="${f(gC)}" stroke-linecap="butt"/>`);
          p.push(`<line class="s-weave" x1="${f(q.x)}" y1="${f(q.y - mh)}" x2="${f(q.x)}" y2="${f(q.y + mh)}"
            stroke="${mainColor}" stroke-width="${f(gM)}" stroke-linecap="butt"/>`);
          p.push(`<line x1="${f(q.x)}" y1="${f(q.y - mh * 0.5)}" x2="${f(q.x)}" y2="${f(q.y + mh * 0.5)}"
            stroke="#fff" stroke-opacity="0.10" stroke-width="${f(gM * 0.3)}" stroke-linecap="round"/>`);
        } else {
          // the cross passes over: shade the main under it, highlight the cross
          const sh = gC * 1.5;
          p.push(`<line x1="${f(q.x)}" y1="${f(q.y - sh)}" x2="${f(q.x)}" y2="${f(q.y + sh)}"
            stroke="#000" stroke-opacity="0.34" stroke-width="${f(gM)}" stroke-linecap="butt"/>`);
          p.push(`<line x1="${f(q.x - mh)}" y1="${f(q.y)}" x2="${f(q.x + mh)}" y2="${f(q.y)}"
            stroke="${crossColor}" stroke-width="${f(gC)}" stroke-linecap="butt"/>`);
          p.push(`<line x1="${f(q.x - mh * 0.5)}" y1="${f(q.y)}" x2="${f(q.x + mh * 0.5)}" y2="${f(q.y)}"
            stroke="#fff" stroke-opacity="0.10" stroke-width="${f(gC * 0.3)}" stroke-linecap="round"/>`);
        }
      });
      p.push('</g>');
    }
    p.push('</g>');

    // In the yoke close-up, everything past the last counted set belongs to the
    // hoop beyond the throat -- it must not read as another set.
    const yokeLimit = (yokeView && o.markThroatPairs)
      ? bed.mains.map(m => Math.abs(m.x)).sort((x, y) => x - y)[o.markThroatPairs * 2 - 1]
      : null;

    if (o.startBeat) {
      // Both centre mains are threaded first, FROM mainsStart -- so the loose
       // ends hang out of the other end of the racket, which is where the first
       // pull and the first clamps happen. Then: clamp one, tension the other,
       // clamp that one too.
      const mid = (bed.mains.length - 1) / 2;
      const A = bed.mains[Math.floor(mid)], B = bed.mains[Math.ceil(mid)];
      const b = o.startBeat, anchorBottom = (o.mainsStart || 'throat') === 'throat';
      const anchorY = m => anchorBottom ? m.bottom - 16 : m.top + 16;
      const pullY = m => anchorBottom ? m.top - 28 : m.bottom + 28;
      // the two centre mains are ~13 mm apart, so two clamps at the same height
      // would overlap: stagger the second one further into the bed
      const pullClampY = (m, stagger) => {
        const off = 14 + (stagger ? 22 : 0);
        return anchorBottom ? m.top + off : m.bottom - off;
      };

      /* labels sit on top of the frame and the strings, so each one gets a
         solid chip behind it -- plain text on a stringbed is unreadable */
      const tag = (x, y, txt, side) => {
        const fs = 10, w = txt.length * fs * 0.55 + 14, h = fs + 9;
        /* The chips hang off the CENTRE mains, so a long one reaches most of a
           half-width sideways -- past the edge of the viewBox, which on a phone
           (the card is about 456 px wide) cut the label off against the left of
           the racket. Clamped into the box: the leader still points at the hole
           it belongs to, so nothing is lost by sliding the chip. */
        const lo = vb[0] + 3, hi = vb[0] + vb[2] - w - 3;
        const rx = Math.max(lo, Math.min(side > 0 ? x + 27 : x - 32 - w + 5, hi));
        /* Sliding a chip in off the edge can park it on the very glyph it is
           labelling -- "clamp here" printed over the clamp. When the chip still
           covers the anchor, step it clear along the string, toward the middle
           of the bed: there is always room there, and the chip is opaque so the
           strings behind it cost nothing. The leader goes diagonal and still
           lands on the hole. Half a clamp is 10 wide by 15 tall. */
        const cy = (rx < x + 14 && rx + w > x - 14) ? y + (y > 0 ? -26 : 26) : y;
        const lead = x <= rx ? rx - 3 : rx + w + 3;
        return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(lead)}" y2="${f(cy)}"
            stroke="${ink}" stroke-width="1.4" stroke-dasharray="4 3" stroke-opacity="0.95"/>
          <circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="${ink}"/>
          <rect x="${f(rx)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" rx="5"
            fill="#080a0e" fill-opacity="0.92" stroke="${ink}" stroke-opacity="0.55" stroke-width="0.9"/>
          <text x="${f(rx + 7)}" y="${f(cy + 3.6)}" text-anchor="start"
            font-size="${fs}" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700"
            fill="${ink2}">${txt}</text>`;
      };
      const gripper = (x, y) => `<g transform="translate(${f(x)} ${f(y)})">
          <rect x="-10" y="-15" width="20" height="30" rx="4" fill="#4b525c"/>
          <rect x="-4.5" y="${anchorBottom ? 11 : -19}" width="9" height="8" rx="2" fill="#8d959f"/>
          <line x1="0" y1="${anchorBottom ? -16 : 16}" x2="0" y2="${anchorBottom ? -32 : 32}"
            stroke="${ink}" stroke-width="1.8" marker-end="url(#pullArrow)"/>
        </g>`;
      /* which string is being pulled has to be unmistakable: the target gets a
         glow down its whole length and the other one is dimmed right back */
      const drawMain = (m, mode) => {
        const dim = mode === 'dim';
        const glow = mode === 'live'
          ? `<line x1="${f(m.x)}" y1="${f(m.top - 2)}" x2="${f(m.x)}" y2="${f(m.bottom + 2)}"
               stroke="${ink}" stroke-width="${f(gM * 4.2)}" stroke-opacity="0.32" stroke-linecap="round"/>`
          : '';
        return glow + `<line x1="${f(m.x)}" y1="${f(m.top - 2)}" x2="${f(m.x)}" y2="${f(m.bottom + 2)}"
          stroke="${mode === 'live' ? ink2 : mainColor}" stroke-width="${f(gM * (mode === 'live' ? 1.25 : 1))}"
          stroke-opacity="${dim ? 0.35 : 1}" stroke-linecap="round"/>`;
      };

      const tailAt = m => anchorBottom ? m.top - 3 : m.bottom + 3;
      const tailDir = anchorBottom ? -1 : 1;
      const perSideM = (bed.mainLenMm / 2 * 1.12 + 450) / 1000;
      // where the mains were fed IN, and where their loose ends now hang
      const pullEnd = anchorBottom ? 'head' : 'throat';

      // 1 thread · 2 clamp · 3 tension · 4 clamp · 5 tension · 6 clamp
      const modeA = b === 5 ? 'live' : (b === 3 ? 'dim' : '');
      const modeB = b === 3 ? 'live' : (b === 5 ? 'dim' : '');
      let g = drawMain(A, modeA) + drawMain(B, modeB);
      g += tailGlyph(A.x, tailAt(A), tailDir, 34, 0, true);
      g += tailGlyph(B.x, tailAt(B), tailDir, 34, 0, true);

      if (b >= 2 && b < 6) g += clampGlyph(A.x, anchorY(A), 'v', 0, true);
      if (b >= 4) g += clampGlyph(B.x, pullClampY(B), 'v', 0, true);
      if (b >= 6) g += clampGlyph(A.x, pullClampY(A, true), 'v', 0, true);

      if (b === 1) {
        // the label names where the LOOSE ends are, which is the far end from
        // the holes they were fed through -- pullEnd, not endName
        g += tag(A.x, tailAt(A) + tailDir * 14, `loose ends at the ${pullEnd}`, -1);
        g += tag(B.x, tailAt(B) + tailDir * 40, `\u2248${perSideM.toFixed(1)} m of slack`, 1);
      }
      if (b === 2) g += tag(A.x, anchorY(A), 'clamp here, across from the slack', -1);
      if (b === 3) { g += gripper(B.x, pullY(B)); g += tag(B.x, -bT * 0.15, 'tension this one', 1); }
      if (b === 4) g += tag(B.x, pullClampY(B), `clamp it at the ${pullEnd}`, 1);
      if (b === 5) { g += gripper(A.x, pullY(A));
                     g += tag(A.x, -bT * 0.15, 'tension this one', -1);
                     g += tag(A.x, anchorY(A), 'release this clamp after', 1); }
      if (b === 6) { g += tag(A.x, pullClampY(A, true), `clamp it at the ${pullEnd} too`, -1);
                     g += tag(B.x, pullClampY(B), 'both holding', 1); }

      overlay += `<g class="beat">${g}</g>`;
    }

    if (stepIdx) {
      // which end the mains are anchored at is the PLAN's mainsStart, not a
      // hole count re-read here -- same fact, one owner
      const anchorBottom = (o.mainsStart || 'throat') === 'throat';
      /* the three actions are separate things, so each one is numbered:
         1 pull the string through · 2 tension it · 3 clamp it */
      const badge = (x, y, n, label, note) =>
        `<g class="hint-dot" tabindex="0" role="img" aria-label="${esc(label)}"
           data-label="${esc(label)}" data-note="${esc(note)}">
           <circle cx="${f(x)}" cy="${f(y)}" r="16" fill="transparent"/>
           <circle class="hint-ring" cx="${f(x)}" cy="${f(y)}" r="10" fill="${ink}"
             stroke="#080a0e" stroke-width="1.4"/>
           <text x="${f(x)}" y="${f(y + 4.6)}" text-anchor="middle" font-size="13" font-weight="800"
             font-family="Inter, Helvetica, Arial, sans-serif" fill="#080a0e">${n}</text>
         </g>`;
      let g = '';
      if (stage === 'mains') {
        const m = mainOrder[stepIdx - 1];
        if (m) {
          const n = Math.floor(rankOf(m) / 2);
          const pulledTop = anchorBottom ? (n % 2 === 0) : (n % 2 === 1);
          const prev = mainOrder[stepIdx - 3];      // same side, one in
          if (prev) {
            const pn = Math.floor(rankOf(prev) / 2);
            const prevTop = anchorBottom ? (pn % 2 === 0) : (pn % 2 === 1);
            const pA = [prev.x, prevTop ? prev.top : prev.bottom];
            const pB = [m.x, prevTop ? m.top : m.bottom];
            g += routeGlyph(pA, pB, 0).replace('class="route"', 'class="route-still"');
            const nm = H.normal(pB[0], pB[1]);
            g += badge((pA[0] + pB[0]) / 2 + nm[0] * 22, (pA[1] + pB[1]) / 2 + nm[1] * 22, 1,
              'Pull it through', 'Take the string over the outside of the frame from the hole it just came out of, and pull it through this one. Do not tension it yet. You are only threading it.');
          }
          const gy = pulledTop ? m.top - 24 : m.bottom + 24;
          g += gripGlyph(m.x, gy, pulledTop ? -1 : 1, 0)
                 .replace('class="grip"', 'class="grip-still"');
          g += badge(m.x + 20, gy, 2, 'Tension it',
            `Put the gripper on the free end and pull to ${o.tension || 'reference'} lb. The machine end alternates top and bottom, because the string runs up one main and back down the next.`);
          const cy2 = pulledTop ? m.top + 9 : m.bottom - 9;
          g += clampGlyph(m.x, cy2, 'v', 0, true);
          g += badge(m.x + 20, cy2, 3, 'Clamp it',
            'Clamp goes on the string you just pulled, as close to the grommet as it will sit. Then the clamp behind it comes free for the next string.');
          const left = 1 - (n + 0.5) / (bed.mains.length / 2);
          g += tailGlyph(m.x, pulledTop ? m.top - 3 : m.bottom + 3, pulledTop ? -1 : 1,
                         22 + 78 * Math.max(0, left), 0, true);
        }
      } else if (stage === 'crosses') {
        const nC = bed.crosses.length;
        const c = (o.crossFromTop !== false) ? bed.crosses[stepIdx - 1] : bed.crosses[nC - stepIdx];
        if (c) {
          // same rule as the animation: pulled out the far side from where it
          // was fed in, alternating with every cross
          const right = ((stepIdx - 1) % 2 === 0) !== ((o.crossStartSide || 1) > 0);
          g += badge(right ? c.left + 18 : c.right - 18, c.y - 15, 1, 'Weave it through',
            'Over, under, over, under across every main, then pull the whole length out the far side. Weave one or two ahead so you always have slack to work with.');
          const gx = right ? c.right + 27 : c.left - 27;
          g += gripGlyph(gx, c.y, right ? -1 : 1, 0, 90)
                 .replace('class="grip"', 'class="grip-still"');
          g += badge(gx, c.y - 21, 2, 'Tension it',
            `Put the gripper on the end you pulled through. Tension it to ${o.tension || 'reference'} lb, then straighten the cross with your fingers.`);
          const kx = right ? c.right - 9 : c.left + 9;
          g += clampGlyph(kx, c.y, 'h', 0, true);
          g += badge(kx, c.y - 21, 3, 'Clamp it',
            'Clamp on the side you pulled from, hard against the frame. It alternates left and right as the weave crosses and comes back.');
        }
      }
      overlay += `<g class="stepped">${g}</g>`;
    }

    if (o.clampDemo && stage === 'mains') {
      // which end the mains are anchored at is the PLAN's mainsStart, not a
      // hole count re-read here -- same fact, one owner
      const anchorBottom = (o.mainsStart || 'throat') === 'throat';
      const endOf = (m, top) => [m.x, top ? m.top : m.bottom];
      const bySide = { l: [], r: [] };
      bed.mains.forEach(m => bySide[m.x < 0 ? 'l' : 'r'].push(m));
      bySide.l.sort((u, v) => v.x - u.x);          // centre outwards
      bySide.r.sort((u, v) => u.x - v.x);
      let routes = '', grips = '';
      ['l', 'r'].forEach(k => {
        bySide[k].forEach((m, n) => {
          if (n === 0) return;                 // centre pair came in last step
          const d = n + 0.5;
          const pulledTop = anchorBottom ? (n % 2 === 0) : (n % 2 === 1);
          const t0 = d * 2 * pace;
          if (n > 0) {
            const prev = bySide[k][n - 1];
            const prevTop = anchorBottom ? ((n - 1) % 2 === 0) : ((n - 1) % 2 === 1);
            routes += routeGlyph(endOf(prev, prevTop), endOf(m, prevTop), t0 - pace * 0.55);
          }
          const gy = pulledTop ? m.top - 24 : m.bottom + 24;
          grips += gripGlyph(m.x, gy, pulledTop ? -1 : 1, t0 + pace * 0.3);
        });
      });
      p.push(`<g class="routes" style="--dur:${f(pace * 0.9)}s">${routes}</g>`);
      p.push(`<g class="grips" style="--dur:${f(pace * 0.8)}s">${grips}</g>`);
    }

    if (o.clampDemo && typeof crossGrips !== 'undefined' && crossGrips) {
      p.push(`<g class="grips" style="--dur:${f(pace * 0.75)}s">${crossGrips}</g>`);
    }
    if (o.clampDemo && typeof tails !== 'undefined' && tails.length) {
      p.push(`<g class="tails" style="--dur:${f(pace * 1.2)}s">`
        + tails.map(t => tailGlyph(t[0], t[1], t[2], t[3], t[4])).join('') + '</g>');
    }
    if (o.clampDemo && typeof clamps !== 'undefined' && clamps.length) {
      p.push(`<g class="clamps" style="--dur:${f(pace * 1.7)}s">`
        + clamps.map(c => clampGlyph(c[0], c[1], c[2], c[3])).join('') + '</g>');
    }

    // ---------------- grommets ----------------
    // Flush in the beam, a ridge across the band at every hole, and the hole
    // itself sitting exactly ON the line of the string that runs through it.
    if (o.grommets) {
      const bore = Math.max(gM, gC);
      let ridges = '', dots = '';
      bed.holes.forEach(h => {
        const nm = H.normal(h.x, h.y);
        const bt = beam(H.tAtPoint(h.x, h.y));
        const q0 = [h.x + nm[0] * bt * 0.08, h.y + nm[1] * bt * 0.08];
        const q1 = [h.x + nm[0] * bt * 0.86, h.y + nm[1] * bt * 0.86];
        ridges += `<line x1="${f(q0[0])}" y1="${f(q0[1])}" x2="${f(q1[0])}" y2="${f(q1[1])}"
          stroke="#05070b" stroke-opacity="0.30" stroke-width="1.1"/>`;
        const c = [h.x + h.dx * 1.6, h.y + h.dy * 1.6];
        const past = yokeLimit !== null && Math.abs(h.x) > yokeLimit + 0.5;
        dots += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(bore * 0.72 + 0.35)}"
          fill="#04060a" fill-opacity="${past ? 0.3 : 0.95}"/>`;
      });
      p.push(`<g class="grommets" clip-path="url(#frameClip)">${ridges}${dots}</g>`);
    }

    const onStrip = (x, y, frac) => {
      const nm = H.normal(x, y);
      const k = beam(H.tAtPoint(x, y)) * frac;
      return [x + nm[0] * k, y + nm[1] * k];
    };

    // the sets of holes in the yoke, ringed on the real hole positions
    const labels = [];
    if (o.markThroatPairs) {
      const bottoms = bed.mains.map(m => [m.x, m.bottom]).sort((u, v) => Math.abs(u[0]) - Math.abs(v[0]));
      const marked = bottoms.slice(0, o.markThroatPairs * 2);
      let rings = '';
      marked.forEach((h, i) => {
        const c = [h[0], h[1] + 1.6];
        // a dark backing ring under the mark, so it separates from the frame
        // whatever that frame is painted -- light, dark or the same hue
        rings += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${yokeView ? 5.4 : 4.2}" fill="none"
            stroke="#05070b" stroke-opacity="0.7" stroke-width="3.6"/>
          <circle cx="${f(c[0])}" cy="${f(c[1])}" r="${yokeView ? 5.4 : 4.2}" fill="none"
            stroke="${ink}" stroke-width="1.8" stroke-opacity="0.95"/>`;
        labels.push([c[0], c[1], Math.floor(i / 2) + 1]);
      });
      p.push(`<g class="throat-marks">${rings}</g>`);
    }

    // ---------------- knots ----------------
    if (o.knots && o.knots.length) {
      p.push(`<g class="knots" style="--d:${f(lastString + 0.3)}s${o.animate ? ';opacity:0' : ''}">`);
      o.knots.forEach(k => {
        const q = onStrip(k.x, k.y, 0.3);
        const ms = o.markScale || 1;      // the guide view is smaller on screen
        // a little knotted-string glyph rather than a plain dot
        p.push(`<g class="knot" tabindex="0" role="img" data-label="${esc(k.label)}"
          data-lesson="${k.lesson === 'start' ? 'start' : 'finish'}" data-note="${esc(k.note || '')}">
          <circle class="knot-hit" cx="${f(q[0])}" cy="${f(q[1])}" r="${f(12 * ms)}" fill="transparent"/>
          <circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(6.8 * ms)}" fill="none"
            stroke="#05070b" stroke-opacity="0.78" stroke-width="${f(3.2 * ms)}"/>
          <circle class="knot-halo" cx="${f(q[0])}" cy="${f(q[1])}" r="${f(8.5 * ms)}" fill="none"
            stroke="${ink}" stroke-opacity="0.5" stroke-width="${f(1.4 * ms)}"/>
          <circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(5 * ms)}" fill="${ink}" fill-opacity="0.95"/>
          <circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(2.3 * ms)}" fill="#000" fill-opacity="0.45"/>
          <title>${esc(k.label)}</title></g>`);
      });
      p.push('</g>');
    }

    if (rig) {
      p.push(rig.front);
      // at the bottom: the pattern label already owns the top of the box
      p.push(`<text x="0" y="${f(vb[1] + vb[3] - 12)}" text-anchor="middle" font-size="12"
        font-weight="800" letter-spacing="2.4" font-family="Inter, Helvetica, Arial, sans-serif"
        fill="${ink}">SIX-POINT MOUNT</text>`);
    }

    if (overlay) p.push(overlay);

    // ---------------- markings ----------------
    if (!headOnly) {
      p.push(`<text x="0" y="${f(shaftTop + 24)}" text-anchor="middle" font-size="8"
        font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" letter-spacing="0.8"
        fill="${ink2}" fill-opacity="0.75">${esc(r.model.toUpperCase())}</text>`);
    }
    // the stepped views have their own caption, and the badges live up here
    if (!beatView && !o.hideLabel) p.push(`<text x="0" y="${f(REF_TOP + (RIG ? 12 : 14))}" text-anchor="middle" font-size="9.5"
      font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600" letter-spacing="2.4"
      fill="${ink2}" fill-opacity="0.55">${esc(bed.patternLabel.toUpperCase())} &#183; ${r.headSize} IN&#178;</text>`);

    if (yokeView) {
      p.push('</g>');   // end squash
      // annotation lives outside the squash so the type is not distorted
      const cy = y => y * SQ;
      const brY = cy(bB + THROAT * 0.20);
      p.push(`<line x1="0" y1="${f(vb[1] + 20)}" x2="0" y2="${f(brY - 4)}"
        stroke="${ink}" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="5 5"/>`);
      p.push(`<text x="0" y="${f(vb[1] + 13)}" text-anchor="middle" font-size="7.5"
        font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600" letter-spacing="0.5"
        fill="${ink}" fill-opacity="0.85">CENTRE LINE</text>`);
      labels.forEach(([x, y, n]) => {
        p.push(`<text x="${f(x)}" y="${f(cy(y) - 15)}" text-anchor="middle" font-size="9.5"
          font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700"
          fill="${ink}">${n}</text>`);
      });
      if (yokeLimit !== null) {
        const bx = yokeLimit + 4, by = brY;
        p.push(`<path d="M${f(-bx)},${f(by - 3)} L${f(-bx)},${f(by)} L${f(bx)},${f(by)} L${f(bx)},${f(by - 3)}"
          fill="none" stroke="${ink}" stroke-opacity="0.8" stroke-width="1.1"/>`);
        p.push(`<text x="0" y="${f(by + 12)}" text-anchor="middle" font-size="7.5"
          font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" letter-spacing="0.6"
          fill="${ink}" fill-opacity="0.9">THE YOKE &#183; ${o.markThroatPairs} SETS</text>`);
        [-1, 1].forEach(side => {
          p.push(`<text x="${f(side * (-vb[0] - 8))}" y="${f(cy(bB) - 6)}"
            text-anchor="${side < 0 ? 'start' : 'end'}" font-size="6.5"
            font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600"
            fill="${ink2}" fill-opacity="0.7">past the yoke</text>`);
        });
      }
    }
    p.push('</svg>');
    return localiseIds(p.join(''), 'r' + (++renderSeq));
  }

  return { render, THROAT };
})();
