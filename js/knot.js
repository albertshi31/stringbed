/* Zoomable, step-by-step knot diagram.
 * Shows the basic tie-off every stringer starts with: a half hitch --
 * wrap the tail around the anchor string to make a loop, pass the tail
 * end through that loop, snug it down. Do it twice and that is a
 * double half hitch, which is all the basic job needs. */
const Knot = (function () {

  const S = (d, c, w, extra) =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;

  /* A black string on a dark panel is invisible, and so is a white one on a
   * light panel. Every strand carries an outline in the opposite direction
   * from its own luminance, so the real colour is kept but the shape reads. */
  function lum(hex) {
    const v = hex.replace('#', '');
    const n = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const edgeFor = c => (lum(c) < 0.42 ? '#dfe4ea' : '#05070a');

  /* One strand of cord: dark edge, body, and a thin core highlight that gives
   * it roundness instead of reading as a flat ribbon. */
  const cord = (d, c, w) =>
    S(d, edgeFor(c), w + 1.8) +
    S(d, c, w) +
    S(d, lum(c) < 0.42 ? '#ffffff' : '#000000', w * 0.3, 'stroke-opacity="0.22"');

  /* Scale/translate a path about a point — the later frames are literally the
   * earlier ones tightened, so the sequence reads as one continuous action. */
  const xf = (d, s, cx, cy, dx, dy) =>
    d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, X, Y) =>
      `${(cx + (X - cx) * s + (dx || 0)).toFixed(1)},${(cy + (Y - cy) * s + (dy || 0)).toFixed(1)}`);

  /* The anchor runs out of the tie-off grommet, not past it. The tie-off hole
     already has this string in it -- that is what makes tie-off holes the
     larger ones -- and the tail is squeezed through the same hole alongside
     it. Drawing the anchor as a bar floating clear of the frame, with the
     grommet a separate slab underneath, showed two things that never touch. */
  const PX = 110;                  // the post's center line, once stood up
  const ANCHOR_Y = 82;             // the anchor's line in the knot's own space

  /* THE KNOT IS AUTHORED FLAT AND STOOD UP AFTERWARDS.
   *
   * These point sets describe a real double half hitch around a HORIZONTAL
   * anchor: over the front, round and behind, and back THROUGH the loop. That
   * last pass is the whole difference between a hitch and a wrap, and it is
   * why the geometry is kept exactly as it was rather than regenerated -- an
   * attempt to draw it directly upright produced a tidy coil that never tucked
   * through itself, which is a different knot. The drawing is rotated onto the
   * upright post at render time instead, which cannot change the topology.
   *
   * One continuous cord from the grommet:
   *   0 .. 12    up, over and back down -- both legs IN FRONT   <- the RAINBOW
   *   12 .. 17   round and up BEHIND the anchor                 <- under it
   *   17 .. 22   back, under the rainbow's leg, into the loop    <- through
   */
  /* Long enough that it still leaves the top of the box at the smallest scale
     any frame draws at -- it is inside the scaled group, so a length that
     overshoots at 0.8 stops mid-air at 0.62. The overshoot is simply clipped. */
  const ANCHOR = 'M24,82 L300,82';
  /* The tail leaves the grommet on the SAME side as the loop it is about to
     make -- above the anchor line here, which is the right of the post once the
     drawing is stood up -- and runs straight up into the rainbow. It used to
     come out the far side and cut across first, which put a crossing in the
     lead that is not part of the knot. */
  const G = [28, 73];              // the tie-off grommet, shared with the anchor

  const LOOSE = {
    lead: 4, rainbow: 12, under: 19, threaded: 23, leg: [8, 13], end: 20,
    pts: [
      /* One arc from the grommet to the apex. The tangent used to swing from
         "along the anchor" to "climbing across it" between two adjacent points,
         and a Catmull-Rom spline answers that with a corner however smooth its
         joints are. Turning it gradually over six points, with even spacing,
         is what makes it read as cord rather than as bent wire. */
      G, [44, 71], [60, 67], [74, 61],       // out of the hole, easing over
      [86, 53],
      [98, 45], [110, 38], [122, 34], [136, 36], [150, 48], [156, 64],
      [157, 82],                             // back down in front of it
      [154, 98], [146, 109], [134, 114], [122, 113], [113, 106], [110, 96],
      [110, 74],                             // up BEHIND it, inside the loop
      [114, 62], [124, 54], [138, 50], [154, 50],
      [170, 54]                              // out under the far leg, to the right
    ]
  };

  /* The same passes in the same order, drawn TIGHT: stacked rather than shrunk,
     so the only place the free end meets the loop is where it is meant to. */
  const TIED = {
    lead: 4, rainbow: 12, under: 19, threaded: 23, leg: [8, 13], end: 20,
    pts: [
      G, [42, 72], [56, 70], [68, 66],
      [78, 60],
      [88, 55], [98, 52], [107, 53], [112, 55], [118, 64], [121, 74],
      [122, 88],
      [120, 98], [112, 102], [104, 102], [98, 98], [96, 92], [96, 88],
      [96, 74],
      [99, 68], [106, 64], [116, 63], [128, 64],
      [140, 66]
    ]
  };

  /* Smooth by construction: a Catmull-Rom spline has a continuous tangent
     everywhere, so there is no corner at any joint. */
  function segs(pts) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1];
      const p3 = pts[i + 2] || pts[i + 1];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      out.push(`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} `
             + `${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
    }
    return out;
  }
  const upTo = (pts, k) => `M${pts[0][0]},${pts[0][1]}` + segs(pts).slice(0, k).join('');
  const fromTo = (pts, i) => `M${pts[i][0]},${pts[i][1]}` + segs(pts).slice(i).join('');

  function sample(pts, n) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1];
      const p3 = pts[i + 2] || pts[i + 1];
      for (let k = 0; k < n; k++) {
        const u = k / n, u2 = u * u, u3 = u2 * u;
        const c = j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u
          + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2
          + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3);
        out.push([c(0), c(1)]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* Every pass the cord makes at the anchor, tagged with which stretch of the
     cord it belongs to, so front-vs-behind is decided by WHERE ON THE KNOT the
     pass is rather than by the order the passes come out in. */
  function anchorCrossings(pts) {
    const N = 12, sm = sample(pts, N), hits = [];
    for (let i = 0; i < sm.length - 1; i++) {
      const a = sm[i][1] - ANCHOR_Y, b = sm[i + 1][1] - ANCHOR_Y;
      if (a === 0 || (a < 0) !== (b < 0)) {
        const u = a / (a - b);
        hits.push({ x: sm[i][0] + (sm[i + 1][0] - sm[i][0]) * u, y: ANCHOR_Y,
                    seg: Math.floor(i / N) });
      }
    }
    return hits;
  }
  /* The rainbow goes in front; the end's one pass, on the way back, goes
     behind. Only the behind pass needs anything done to it. */
  const behindPasses = (sh, pts, w) => anchorCrossings(pts)
    .filter(h => h.seg >= sh.rainbow).map(h => [h.x, h.y, w || 11]);

  /* Where the woven end comes out across the rainbow's far leg -- the THROUGH.
     Found by intersecting the two stretches rather than positioned by hand. */
  function weaveCrossing(sh, pts) {
    if (pts.length <= sh.end + 1) return null;
    const leg = sample(pts.slice(sh.leg[0], sh.leg[1]), 20);
    const end = sample(pts.slice(sh.end), 20);
    const hit = (p, q, r, w) => {
      const d = (q[0] - p[0]) * (w[1] - r[1]) - (q[1] - p[1]) * (w[0] - r[0]);
      if (!d) return null;
      const u = ((r[0] - p[0]) * (w[1] - r[1]) - (r[1] - p[1]) * (w[0] - r[0])) / d;
      const v = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
      return (u >= 0 && u <= 1 && v >= 0 && v <= 1)
        ? [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u] : null;
    };
    for (let i = 0; i < leg.length - 1; i++)
      for (let j = 0; j < end.length - 1; j++) {
        const h = hit(leg[i], leg[i + 1], end[j], end[j + 1]);
        if (h) return h;
      }
    return null;
  }
  const overLeg = (sh, pts, r) => {
    const q = weaveCrossing(sh, pts);
    return q ? [q[0], q[1], r || 9] : null;
  };

  /* Slide a knot along the anchor without letting go of the grommet: only the
     KNOT moves, and the run in from the grommet is then re-laid to reach it. */
  const place = (sh, pts, dx) => {
    /* The knot moves by dx; the grommet stays put; the lead is re-spaced EVENLY
       between the two, keeping its own rise. A graded share of dx looked right
       but bunched the lead badly on a large shift -- 14-unit steps became 1.5 --
       and a spline through bunched points ripples. Even spacing, original rise:
       the shape survives and the curvature stays smooth. */
    const p = pts.map((q, i) => (i < sh.lead ? q.slice() : [q[0] + dx, q[1]]));
    const x0 = p[0][0], x1 = p[sh.lead][0];
    for (let i = 1; i < sh.lead; i++) p[i][0] = x0 + (x1 - x0) * (i / sh.lead);
    return p;
  };
  /* The second hitch is tied with the tail coming out of the FIRST one, so its
     run in starts there rather than at the grommet. The lead is TRANSLATED to
     that new start and the offset faded out by the time it reaches the knot,
     which keeps the eased arc. It used to re-lay those points as a straight
     line AND force the entry's height to match the join, which flattened the
     second hitch's approach and put a corner at each end of the run between
     them -- the rigid stretch on the right of step 5. */
  function follows(sh, pts, from) {
    const p = pts.slice();
    const dx = from[0] - p[0][0], dy = from[1] - p[0][1];
    for (let i = 0; i <= sh.lead; i++) {
      const k = 1 - i / sh.lead;
      p[i] = [p[i][0] + dx * k, p[i][1] + dy * k];
    }
    return p;
  }

  function frames(col) {
    const bg = col.bg, t = col.tail, a = col.anchor, hi = col.accent;
    // the post is a little slimmer than the cord, as it is in the reference
    const W = 8, AW = 8;

    const label = (x, y, txt, anchorPos) =>
      `<text x="${x}" y="${y}" fill="${hi}" font-size="7.5" font-family="Inter,Helvetica,Arial,sans-serif"
        font-weight="700" text-anchor="${anchorPos || 'middle'}" paint-order="stroke"
        stroke="${bg}" stroke-width="3" stroke-linejoin="round">${txt}</text>`;
    const arrow = d => S(d, hi, 1.8, 'marker-end="url(#kArrow)" stroke-dasharray="5 4"');
    /* labels go where there is room; a leader takes the eye to the thing meant */
    const ring = (x, y, r) =>
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r || 7.5}" fill="none"
        stroke="${hi}" stroke-width="1.4" stroke-opacity="0.9"/>`;

    /* THE FRAME, WITH THE TIE-OFF GROMMET IN IT, AT THE BASE.
       One hole, two strings. The anchor is the string already installed and
       tensioned through it, standing up out of the grommet; the tail is fed
       through the same hole so it comes out alongside, and the hitches are
       tied on the anchor just above the mouth. The knot seats down against the
       outside of the grommet. */
    /* The frame band is a dark edge, not a lit slab -- a near-white bar across
       the foot of the picture pulled the eye straight off the knot. The ferrule
       stays metallic, because that is the thing being pointed at. */
    const wallFill = edgeFor(t) === '#05070a' ? '#2b3138' : '#191d23';
    const wallInk = '#aeb6c2';
    const seat =
      // the frame, with the tie-off grommet's ferrule standing proud of it --
      // both the anchor and the tail come up out of that one ferrule
      `<rect x="-12" y="156" width="248" height="24" rx="4" fill="${wallFill}"/>
       <rect x="-12" y="156" width="248" height="2.5" fill="#ffffff" opacity="0.13"/>
       <rect x="${PX - 14}" y="136" width="28" height="24" rx="5" fill="#9aa3b0"/>
       <rect x="${PX - 10}" y="139" width="5" height="18" rx="2.5" fill="#ffffff" opacity="0.4"/>
       <rect x="${PX - 14}" y="136" width="28" height="24" rx="5" fill="none"
         stroke="#4c545f" stroke-width="1"/>
       <ellipse cx="${PX}" cy="137" rx="14" ry="4.6" fill="#7d8694"/>
       <ellipse cx="${PX}" cy="137" rx="7.5" ry="2.4" fill="#05070a" opacity="0.9"/>
       <text x="224" y="166" text-anchor="end" font-size="6.5"
         font-family="Inter,Helvetica,Arial,sans-serif" font-weight="600"
         fill="${wallInk}">tie-off grommet</text>
       <text x="224" y="175" text-anchor="end" font-size="6.5"
         font-family="Inter,Helvetica,Arial,sans-serif"
         fill="#8f9aa7">both strings come up through it</text>`;

    /* THE ROTATION. The knot's point sets describe a correct double half hitch
       around a HORIZONTAL anchor, and they are left exactly as they are: the
       cord is drawn through a -90° rotation instead, which stands the anchor up
       out of the grommet without touching the topology. Everything that must
       not be rotated -- type, arrows, leaders -- is drawn outside the group, and
       `at()` maps a knot-space point into view space so those can still be
       placed against the cord. */
    /* Stood up at render time. The grommet in the knot's own space, (24,82),
       lands on the ferrule mouth; `at()` is the same mapping so labels and
       leaders can be placed against the cord without positioning anything
       twice. Rotation cannot change which strand passes over which. */
    /* scale(-1 1) mirrors the whole drawing about the post, so the tail leaves
       the grommet on the LEFT of the anchor and the loops fall to the right.
       A mirrored double half hitch is still a double half hitch -- only the
       handedness changes, which the notes below already say does not matter --
       so nothing inside the group needs re-authoring. Only circles and cord
       are drawn in here; type stays outside, where a mirror would reverse it. */
    /* Two hitches are twice the cord of one, so the last frame is drawn a little
       smaller -- otherwise it runs off the top and under the zoom control. The
       scale is a parameter rather than a second transform so `at()` stays the
       one place a knot point becomes a view point. */
    const K = 0.8, K2 = 0.62, GX = 110, GY = 137;
    const upright = (g, k) =>
      `<g transform="translate(${GX} ${GY}) scale(-1 1) rotate(-90) scale(${k || K}) translate(-24 -82)">${g}</g>`;
    const at = (q, k) => [GX - (k || K) * (q[1] - ANCHOR_Y), GY - (k || K) * (q[0] - 24)];

    /* a cut end: flat, with the string's cross-section showing */
    const cutEnd = (x, y, ang) =>
      `<g transform="translate(${x} ${y}) rotate(${ang})">
         <ellipse cx="0" cy="0" rx="${W / 2 + 1.3}" ry="${W / 2 + 1.3}" fill="${edgeFor(t)}"/>
         <ellipse cx="0" cy="0" rx="${W / 2}" ry="${W / 2}" fill="${t}"/>
         <ellipse cx="0" cy="0" rx="${W / 2 - 1.4}" ry="${W / 2 - 1.4}" fill="#000" opacity="0.18"/>
       </g>`;

    /* The tail is ONE cord from the grommet to the cut end. Drawing it as a
     * single path means no butt joints and no stubs.
     *
     * The tensioned string goes down FIRST and whole, and is never drawn over
     * or cut into again — it is the one thing in the picture that has to read
     * as continuous. The cord then goes on top of it, with the single pass that
     * belongs BEHIND masked away across the string's own band, so that pass
     * simply disappears at the string and picks up again on the far side.
     *
     * The previous way round — cord first, string over it, then windows punched
     * back through the string for the front passes — left the string looking
     * bitten out wherever a window's edge landed on it. */
    /* The cut has to fall just INSIDE the string's own outline, so the outline
     * covers it and the cord simply vanishes at the edge. Cutting outside it
     * left a hair of background between the cord's squared-off end and the
     * string, which is what read as a chopped, ragged loop. */
    const BAR_HALF = (AW + 1.8) / 2 + 0.3;
    const BAR_TOP = ANCHOR_Y - BAR_HALF, BAR_H = BAR_HALF * 2;
    let uid = 0;
    const build = specs => {
      const list = [].concat(specs);
      let defs = '', out = cord(ANCHOR, a, AW);
      list.forEach(sp => {
        const id = 'kc' + (++uid);
        const holes = (sp.behind || []).map(o =>
          `<rect x="${(o[0] - o[2]).toFixed(1)}" y="${BAR_TOP.toFixed(1)}"
             width="${(o[2] * 2).toFixed(1)}" height="${BAR_H.toFixed(1)}" fill="#000"/>`).join('');
        defs += `<mask id="${id}m" maskUnits="userSpaceOnUse" x="-40" y="-40" width="320" height="260">`
              + `<rect x="-40" y="-40" width="320" height="260" fill="#fff"/>${holes}</mask>`;
        out += `<g mask="url(#${id}m)">${cord(sp.tail, t, W)}</g>`;
        (sp.fronts || []).forEach((f, i) => {
          const o = f.at;
          defs += `<clipPath id="${id}f${i}"><circle cx="${o[0]}" cy="${o[1]}" r="${o[2]}"/></clipPath>`;
          out += `<g clip-path="url(#${id}f${i})">${cord(f.d, t, W)}</g>`;
        });
      });
      return `<defs>${defs}</defs>${out}`;
    };

    const F = [];

    /* one knot's worth of drawing instructions; the over/unders come out of
       the cord actually being drawn, so partial and tightened frames both get
       the right ones without anything being written down twice */
    const spec = (sh, pts, upto) => {
      const sub = pts.slice(0, upto + 1);
      const out = { tail: upTo(pts, upto), behind: behindPasses(sh, sub) };
      /* THE TUCK. The free end comes out IN FRONT of the loop, so where it
         meets the rainbow's far leg it is the near strand -- that crossing is
         what makes this a hitch rather than a wrap, and it is redrawn on top
         inside a small clip so the two strands read correctly. */
      const u = overLeg(sh, sub);
      if (u) out.fronts = [{ d: fromTo(pts, sh.end), at: u }];
      return out;
    };
    const hitch = (sh, pts, upto) => build(spec(sh, pts, upto));
    const endOf = pts => pts[pts.length - 1];
    const L = LOOSE.pts;

    const anchorLabel = label(224, 21, 'the anchor string', 'end')
      + S('M116,18 L150,18', hi, 1, 'stroke-opacity="0.45" stroke-dasharray="3 3"');
    const lead = (from, q) => {
      const p2 = at(q);
      return S(`M${from[0]},${from[1]} L${p2[0].toFixed(0)},${p2[1].toFixed(0)}`,
               hi, 1, 'stroke-opacity="0.55" stroke-dasharray="3 3"');
    };
    const T = TIED.pts, eT = endOf(T);

    F.push({
      title: 'Make a loop (‘rainbow’) over the anchor string',
      caption: 'The tail comes out of the grommet <b>alongside the anchor</b>, so both strings share that hole. Lay the tail up over the anchor and back down to make a loop. Both sides of that loop stay on <b>your side</b> of the anchor. Stringers call this shape a <b>rainbow</b>.',
      why: 'Keeping both sides in front is what leaves a loop to thread the end through. If one side goes behind instead, there is nothing to put the end through. That is just a wrap, not a knot.',
      svg: seat + upright(hitch(LOOSE, L, LOOSE.rainbow))
        + anchorLabel
        + lead([148, 97], [118, 46]) + label(224, 100, 'both legs in front', 'end')
    });

    F.push({
      title: 'Take the end under the anchor',
      caption: 'Now take the free end <b>under</b> the anchor, behind it and away from you. Bring it back up on the far side, inside the loop you just made.',
      why: 'This is the only part of the knot that goes behind. Everything else stays on your side.',
      svg: seat + upright(hitch(LOOSE, L, LOOSE.under)
          + (() => { const h = anchorCrossings(L.slice(0, LOOSE.under + 1)).pop();
               return h ? ring(h.x, h.y, 11) : ''; })())
        + anchorLabel
        + lead([70, 64], [110, 82]) + label(66, 68, 'under it, behind', 'end')
    });

    F.push({
      title: 'Back through the loop',
      caption: 'Bring it back and weave it <b>through the loop</b>. It goes under one side of the rainbow and out into the opening. <b>This pass is what makes it a knot.</b>',
      why: 'The end is now trapped between the rainbow and the anchor, so pulling the tail closes the rainbow onto it. Without this pass the string is only wrapped around the anchor and will slide.',
      svg: seat + upright(hitch(LOOSE, L, LOOSE.threaded)
          + cutEnd(endOf(L)[0], endOf(L)[1], 8)
          + (() => { const q = weaveCrossing(LOOSE, L);
               return q ? ring(q[0], q[1], 10) : ''; })())
        + anchorLabel
        + lead([156, 129], [140, 56]) + label(224, 132, 'through the loop', 'end')
    });

    F.push({
      title: 'Pull it tight',
      caption: 'Pull the <b>free end</b>, the one you just brought through the loop. The whole knot closes onto the anchor, on the <b>stringbed side</b>, snug against the grommet. <b>Pull it tighter than this drawing shows.</b>',
      why: 'Do not pull the other part, the one coming out of the grommet. That side is already under tension, and pulling it just drags the knot along the anchor. A real knot closes into a small, hard lump with no gaps. The drawing keeps the turns open so you can still see which strand goes where.',
      svg: seat + upright(hitch(TIED, T, TIED.threaded) + cutEnd(eT[0], eT[1], 12))
        + anchorLabel
        + lead([152, 113], [128, 66]) + label(224, 116, 'pull the free end', 'end')
    });

    /* ONE RUN BETWEEN THE TWO HITCHES.
       The first hitch's tail drifts away from the anchor as it exits, and the
       second hitch's lead curves back toward it -- butt those together and the
       cord bulges out and back in, which is the snake on the right. Between two
       hitches there is no tail and no lead: the end leaves the first loop and
       goes straight on into the second. So the first's trailing drift and the
       second's lead are both dropped, and the gap is bridged by an even,
       monotonic run -- the clean vertical the reference shows. */
    /* The FIRST hitch is not moved at all, so its lead keeps the spacing it was
       drawn with. Sliding both apart from the center was what forced the lead
       into the grommet and put the ripples in it. Only the second travels. */
    const A5 = T;
    const B5 = place(TIED, T, 48);
    const exit = TIED.end;                     // where the end leaves the first loop
    const bridge = [];
    (() => {
      const from = A5[exit], to = B5[TIED.lead];
      for (let k = 1; k <= 2; k++) {
        const u = k / 3;
        bridge.push([from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u]);
      }
    })();
    const both = A5.slice(0, exit + 1).concat(bridge, B5.slice(TIED.lead));
    const e5 = endOf(both);
    // where the second hitch's own end lands once the two are spliced
    const secondEnd = exit + 1 + bridge.length + (TIED.end - TIED.lead);
    const spec5 = {
      tail: upTo(both, both.length - 1),
      behind: behindPasses(TIED, A5.slice(0, exit + 1)).concat(behindPasses(TIED, B5)),
      fronts: [[A5, exit], [B5, secondEnd]]
        .map(([pts, i]) => {
          const u = overLeg(TIED, pts);
          return u ? { d: fromTo(both, i), at: u } : null;
        }).filter(Boolean)
    };
    F.push({
      title: 'Do it twice, then trim',
      caption: 'The tail comes out of the first knot. Tie <b>exactly the same thing again</b> right next to it, with the same rainbow, the same side and the same weave. You need both, because one on its own can work loose. Then trim the tail to about <b>4 mm</b>. That keeps it neat, but leaves enough so it cannot slip back through the knot.',
      svg: seat + upright(build(spec5) + cutEnd(e5[0], e5[1], 12), K2)
        + (() => { const c = at(e5, K2);
             return S(`M${(c[0] - 6).toFixed(0)},${(c[1] - 6).toFixed(0)} l12,12 `
                    + `M${(c[0] + 6).toFixed(0)},${(c[1] - 6).toFixed(0)} l-12,12`,
                      hi, 1.8, 'opacity="0.9"')
               + S(`M${(c[0] + 10).toFixed(0)},${c[1].toFixed(0)} L188,${c[1].toFixed(0)}`,
                   hi, 1, 'stroke-opacity="0.55" stroke-dasharray="3 3"')
               + label(224, (c[1] + 4).toFixed(0), 'cut to ~4 mm', 'end'); })()
        + (() => { const f = at(A5[11], K2), g2 = at(B5[11], K2);
             return S(`M66,${f[1].toFixed(0)} L${f[0].toFixed(0)},${f[1].toFixed(0)}`,
                      hi, 1, 'stroke-opacity="0.55" stroke-dasharray="3 3"')
                  + label(62, f[1] + 4, 'first', 'end')
                  + S(`M66,${g2[1].toFixed(0)} L${g2[0].toFixed(0)},${g2[1].toFixed(0)}`,
                      hi, 1, 'stroke-opacity="0.55" stroke-dasharray="3 3"')
                  + label(62, g2[1] + 4, 'second', 'end'); })()
    });

    return F;
  }

  /* Mount an interactive, zoomable diagram into `el`. */
  function mount(el, col) {
    const F = frames(col);
    /* 1.0x shows the whole knot with a modest margin. It was 0.60, which put
       the figure in the middle of a box more than twice its area and left it
       looking lost in there. The ceiling is not the box but the two overlays
       inside it -- the zoom control at the top right and the pan hint at the
       bottom left -- which need clear ground to sit on; at 0.9 the callouts
       ran underneath them and the grommet ran off the corner. */
    const BASE = 1.0;
    let i = 0, zoom = 1, px = 0, py = 0, drag = null;

    el.innerHTML = `
      <div class="knot-stage">
        <svg class="knot-svg" viewBox="-8 -6 236 186">
          <defs>
            <marker id="kArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 z" fill="${col.accent}"/>
            </marker>
          </defs>
          <g class="knot-view"></g>
        </svg>
        <div class="knot-zoom">
          <button data-z="-1" title="Zoom out">&minus;</button>
          <span class="knot-zlevel">1.0&times;</span>
          <button data-z="1" title="Zoom in">+</button>
          <button data-z="0" title="Reset">Reset</button>
        </div>
        <div class="knot-hint">${(window.matchMedia && matchMedia('(hover: none)').matches) ? 'drag to pan &middot; + and &minus; to zoom' : 'scroll to zoom &middot; drag to pan'}</div>
      </div>
      <div class="knot-legend">
        <span><i style="background:${col.tail}"></i> tail, the end you are tying</span>
        <span><i style="background:${col.anchor}"></i> anchor, the string you tie onto</span>
      </div>
      <div class="knot-side">
        <div class="knot-steps"></div>
        <div class="knot-body">
          <h4 class="knot-title"></h4>
          <div class="knot-caption"></div>
        </div>
        <div class="knot-nav">
          <button type="button" class="btn ghost" data-kn="-1">Previous move</button>
          <span class="knot-count"></span>
          <button type="button" class="btn primary" data-kn="1">Next move</button>
        </div>
      </div>`;

    const view = el.querySelector('.knot-view');
    const svg = el.querySelector('.knot-svg');
    const stepsEl = el.querySelector('.knot-steps');
    const zl = el.querySelector('.knot-zlevel');

    stepsEl.innerHTML = F.map((f, k) =>
      `<button type="button" class="knot-step" data-k="${k}"><span>${k + 1}</span>${f.title}</button>`).join('');
    const body = el.querySelector('.knot-body');

    function apply() {
      // zoom about the middle of the diagram, then pan
      view.setAttribute('transform',
        `translate(${110 + px} ${100 + py}) scale(${(zoom * BASE).toFixed(4)}) translate(-110 -100)`);
      zl.textContent = zoom.toFixed(1) + '×';
    }
    function draw() {
      view.innerHTML = F[i].svg;
      el.querySelector('.knot-title').textContent = (i + 1) + '. ' + F[i].title;
      el.querySelector('.knot-caption').innerHTML = F[i].caption
        + (F[i].why ? `<details class="why"><summary>Why this step?</summary><p>${F[i].why}</p></details>` : '');
      const btns = [...stepsEl.querySelectorAll('.knot-step')];
      btns.forEach((b, k) => {
        b.classList.toggle('on', k === i);
        b.classList.toggle('past', k < i);
        b.setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
      // the explanation opens under the step it belongs to
      stepsEl.insertBefore(body, btns[i].nextSibling);
      el.querySelector('.knot-count').textContent = `Move ${i + 1} of ${F.length}`;
      el.querySelector('[data-kn="-1"]').disabled = i === 0;
      const nx = el.querySelector('[data-kn="1"]');
      nx.disabled = i === F.length - 1;
      nx.textContent = i === F.length - 1 ? 'Last move' : 'Next move';
    }
    function go(k) { i = Math.max(0, Math.min(F.length - 1, k)); draw(); }

    stepsEl.addEventListener('click', e => {
      const b = e.target.closest('.knot-step'); if (b) go(+b.dataset.k);
    });
    el.querySelector('.knot-nav').addEventListener('click', e => {
      const b = e.target.closest('[data-kn]'); if (b) go(i + Number(b.dataset.kn));
    });
    el.querySelector('.knot-zoom').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const z = +b.dataset.z;
      if (z === 0) { zoom = 1; px = py = 0; }
      else zoom = Math.max(0.5, Math.min(8, zoom * (z > 0 ? 1.35 : 1 / 1.35)));
      apply();
    });
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      zoom = Math.max(0.5, Math.min(8, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      apply();
    }, { passive: false });
    svg.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, px, py }; svg.setPointerCapture(e.pointerId);
      svg.classList.add('grabbing');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      const sx = 220 / r.width, sy = 170 / r.height;
      px = drag.px + (e.clientX - drag.x) * sx;
      py = drag.py + (e.clientY - drag.y) * sy;
      apply();
    });
    svg.addEventListener('pointerup', () => { drag = null; svg.classList.remove('grabbing'); });

    draw(); apply();
    return { next: () => go(i + 1), prev: () => go(i - 1) };
  }

  /* The starting-knot diagram is a different knot with a different route, but
     it is the same MATERIAL -- same cord shading, same edge-contrast rule --
     so it borrows these rather than growing a second, drifting copy. */
  return { frames, mount, cord, edgeFor, lum, S };
})();
