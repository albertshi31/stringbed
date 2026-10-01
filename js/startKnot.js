/* The STARTING knot: what anchors a two-piece cross bunch before the first
 * cross is tensioned. A different knot from the finishing tie-off, for a
 * different reason -- both sit on the STRINGBED SIDE, snug against the grommet, but a
 * tie-off only has to hold a string that is already at tension, while this one
 * is pulled against on the very next stroke. So it is built for bulk.
 *
 * THE ROUTE, and every stroke below follows it in order:
 *
 *   1. Out of the grommet, take the tail OVER the front of the anchor main,
 *      round the left, and back UNDER behind it. That is one loop.
 *   2. Do it again, higher up. Two loops.
 *   3. Take the tail OVER the front once more and then all the way around --
 *      over the top, down the far side, along the bottom. Loose, this reads as
 *      a big circuit; it is the third wrap, and it only closes when the knot
 *      is pulled up.
 *   4. Feed the tail UP through the first two loops: under each front band,
 *      over each back band, and out at the top.
 *   5. Pull the tail. The circuit closes, the wraps stack, and the knot cinches
 *      into a bulky mass on the stringbed side, snug against the grommet.
 *
 * Drawing over and under. The cord is one continuous path, so the crossings
 * cannot come from path order alone. Instead: the whole cord is laid down, the
 * anchor is drawn over ALL of it -- which makes every crossing read as behind
 * -- and the passes that belong in FRONT are then struck again on top as short
 * stubs. The tail is drawn between those two layers, which is exactly what
 * being threaded through a loop means: over the back bands, under the front
 * ones.
 */
const StartKnot = (function () {

  const A = 88;                 // the anchor main's center line
  const W = 7.5;                // cord width
  const AW = 9;                 // anchor width
  const WALL = 244;             // top of the frame wall
  const MOUTH = WALL - 20;      // the hole's center -- where a string ends
  const VB = '0 0 200 272';

  const f = n => (Math.round(n * 10) / 10);

  /* The knot is only readable if the anchor main is obviously NOT the cord.
     The caller's anchor colour is picked for the tie-off diagram, where the
     two strands sit apart; here they are wrapped round each other, and a
     silver string on a silver main is one grey tangle. So the anchor is chosen
     for maximum separation from the cord, from a small set that stays inside
     the app's palette. */
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function far(a, b) {
    const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
    return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2
                   + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
  }
  const ANCHORS = ['#c8913a', '#5f86c4', '#3f9a76', '#e6e9ee'];
  const anchorFor = tail =>
    ANCHORS.reduce((best, c) => far(c, tail) > far(best, tail) ? c : best);

  /* ---- the route, as coordinates ---------------------------------------- */
  /* Two tight loops round the anchor. Front band above, back band below, so
     each loop reads as a ring seen slightly from above. */
  /* Loop 1 sits clear of the ferrule: its back band used to run at 228, right
     across the grommet's mouth at ~223, so the first wrap looked as though it
     were tied into the hole rather than on the main above it. */
  /* The wraps sit ON the main, above the grommet -- not against it. At 180/212
     the first wrap's lower edge landed three units above the collar's rim,
     which at any real size is touching: the knot read as jammed into the hole
     rather than seated on the frame outside it. Lifted clear, and the gap is
     what stage three's callout is pointing at. */
  const L1 = { front: 166, back: 198 };
  const L2 = { front: 114, back: 146 };
  const TOP = 52;               // the third wrap's pass across the front
  const TAIL_X = 66;            // the tail runs up INSIDE the loops, beside the anchor
  /* Where the tail comes out of the hole. Close to the main, because they share
     that hole: at 102 it rose 14 from the main and 7 from the hole's own center,
     so it left the mouth at the rim and read as coming out of the collar's
     shoulder rather than out of the hole. The two now sit either side of the
     center by the same amount, which is what the finishing diagram does. */
  const TAIL_STAND = 99;

  // out of the grommet, up, then loop 1: over the front, round the left, under the back
  /* The tail comes up out of the SAME grommet as the anchor main -- the tie-off
     hole already has that main in it, and the cross string is fed through
     alongside, exactly as the finishing tie-off is. It used to rise from a
     second hole of its own, which drew two strings that never meet. */
  const LOOP1 = `M${TAIL_STAND},${MOUTH} L${TAIL_STAND},176 C${TAIL_STAND},170 95,166 90,166 L62,166`
              + ' C50,166 42,172 42,182 C42,192 50,198 62,198 L134,198';
  // up the outside, then loop 2, the same way
  const LOOP2 = ' C148,198 154,191 154,182 L154,130 C154,120 144,114 130,114 L62,114'
              + ' C50,114 42,120 42,130 C42,140 50,146 62,146 L134,146';
  // the third wrap, drawn loose: over the front at the top, down the far side,
  // along the bottom, and back to where the tail goes up through the loops
  const CIRCUIT = ' C150,146 172,138 174,126 L174,74 C174,62 164,54 150,54 L22,54'
                + ' C12,54 6,60 6,70 L6,222 C6,232 14,237 24,237 L58,237';
  /* Where the third wrap leaves loop 2 it crosses the strand climbing the
     outside between the loops. Redrawn on top so it plainly passes over it,
     instead of the two melting into one blob. */
  const CROSS_OUT = 'M120,146 L134,146 C150,146 172,138 174,126 L174,108';
  // the tail, threaded up through loop 1 and loop 2. It starts back on the
  // bottom run, so it continues the circuit rather than butting onto it.
  const TAIL_LO = `M36,237 L58,237 C68,237 ${TAIL_X},231 ${TAIL_X},222 L${TAIL_X},98`;
  /* The run from the hole up to the first wrap, redrawn over the cord so the
     back band it passes reads as behind it rather than welded to it. */
  const STAND = `M${TAIL_STAND},${MOUTH} L${TAIL_STAND},183`;
  const TAIL_HI = `M${TAIL_X},106 L${TAIL_X},30`;
  // the third wrap's pass across the front runs on the circuit's top line
  const TOP_Y = 54;

  /* A front pass is redrawn over the anchor. It is laid exactly on top of the
     cord it repeats and drawn with FLAT ends (see `flush`), so it has no
     seam: only the crossing changes, not the string. Wide enough to cover the
     tail too where the tail has to read as threaded UNDER it. */
  const stub = (y, overTail) => overTail
    ? `M102,${y} L62,${y} C50,${y} 42,${y + 6} 42,${y + 16}`
    : `M102,${y} L74,${y}`;
  /* Loop 1's front pass starts at the hole: the standing part, the bend, and
     the pass across the main, all in front of the back band behind them. */
  const FRONT1 = (overTail) => `M${TAIL_STAND},${MOUTH} L${TAIL_STAND},176`
    + ` C${TAIL_STAND},170 95,166 90,166 ` + (overTail ? 'L62,166 C50,166 42,172 42,182' : 'L74,166');

  /* The same strand as Knot.cord, but with flat ends: an overlay drawn along
     the cord it repeats disappears into it, where round ends and their dark
     outline left a pill-shaped seam at each end. */
  const flush = (d, c, w, trim) => {
    const hi = Knot.lum(c) < 0.42 ? '#ffffff' : '#000000';
    const p = (stroke, sw, extra) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"`
      + ` stroke-linecap="butt" stroke-linejoin="round"${extra || ''}/>`;
    /* the outline stops just short of both ends: the cord underneath already
       draws its outline there, and a second one ending on top of it left a
       faint hairline across the string */
    const dash = { start: '0 3 97', end: '97 3' }[trim] || '0 3 94 3';
    return p(Knot.edgeFor(c), w + 1.8, ` pathLength="100" stroke-dasharray="${dash}"`)
      + p(c, w) + p(hi, w * 0.3, ' stroke-opacity="0.22"');
  };

  /* ---- pieces of scenery ------------------------------------------------- */
  function scenery(col, opts) {
    const wallFill = Knot.edgeFor(col.tail) === '#05070a' ? '#2b3138' : '#191d23';
    const o = opts || {};
    /* BEHIND the strings: the frame itself. The grommet is drawn separately,
       and after them -- see `ferrule` below. */
    return `<rect x="-4" y="${WALL}" width="208" height="30" rx="5" fill="${wallFill}"/>
      <rect x="-4" y="${WALL}" width="208" height="3" fill="#ffffff" opacity="0.13"/>
      ${o.noAnchorLabel ? '' : `<text x="${A - 6}" y="26" text-anchor="end" font-size="9"
        font-family="Inter,Helvetica,Arial,sans-serif" font-weight="700" fill="${col.accent}"
        paint-order="stroke" stroke="${col.bg}" stroke-width="3.5"
        stroke-linejoin="round">a tensioned main</text>`}`;
  }

  /* BEHIND the strings, and the strings stop inside its mouth.
     Drawn over the cord instead, the collar swallowed both strings from its top
     rim down -- a 20-unit grey barrel eating the last stretch of every string,
     which is what made this figure read worse than the finishing one. That one
     lays its grommet down first and runs the cord over it, so the string ends
     in the black oval, which is where a string going into a hole should end.
     What it took to make the hole READ as a hole:
       - The hole is centered between the two strings, not on the main. Both
         share it, and a hole centered on the main put the cross string out at
         its rim -- so the cord came up out of grey metal, which is what looked
         wrong. `MOUTH` spans both cords with clearance either side.
       - The dark mouth is nearly as big as the collar's top face. An ellipse is
         only at its highest above its own center, so a narrow hole inside a
         wide face leaves a band of metal above any cord that is off-center, and
         the cord appears to sprout from the collar.
       - The whole thing is smaller. At 42x26 against a 7.5-wide cord it read as
         a boulder the knot was balanced on. */
  const HOLE = (A + TAIL_STAND) / 2;      // midway between the two strings in it
  function ferrule(col) {
    return `<ellipse cx="${HOLE}" cy="${WALL - 3}" rx="23" ry="5.5" fill="#6c7581"/>
      <rect x="${HOLE - 19}" y="${WALL - 19}" width="38" height="20" fill="#9aa3b0"/>
      <rect x="${HOLE - 15}" y="${WALL - 16}" width="5" height="15" rx="2.5"
        fill="#ffffff" opacity="0.35"/>
      <rect x="${HOLE - 19}" y="${WALL - 19}" width="38" height="20" fill="none"
        stroke="#4c545f" stroke-width="1"/>
      <ellipse cx="${HOLE}" cy="${WALL - 19}" rx="20" ry="5.4" fill="#7d8694"/>
      <ellipse cx="${HOLE}" cy="${WALL - 19}" rx="16" ry="5" fill="#05070a"/>
      <ellipse cx="${HOLE}" cy="${WALL - 19}" rx="16" ry="5" fill="none"
        stroke="#59616c" stroke-width="0.9"/>
      <text x="194" y="${WALL + 13}" text-anchor="end" font-size="8.5"
        font-family="Inter,Helvetica,Arial,sans-serif" font-weight="600"
        fill="#aeb6c2">tie-off grommet</text>
      <text x="194" y="${WALL + 24}" text-anchor="end" font-size="8.5"
        font-family="Inter,Helvetica,Arial,sans-serif"
        fill="#8f9aa7">both strings come up through it</text>`;
  }

  const anchor = col => Knot.cord(`M${A},${MOUTH} L${A},18`, anchorFor(col.tail), AW);

  /* a numbered badge, so the stages read without relying on colour */
  const badge = (x, y, n, col) =>
    `<circle cx="${x}" cy="${y}" r="8.5" fill="${col.bg}" stroke="${col.accent}" stroke-width="1.4"/>
     <text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="10" font-weight="800"
       font-family="Inter,Helvetica,Arial,sans-serif" fill="${col.accent}">${n}</text>`;

  const tag = (x, y, txt, col, anchorPos) =>
    `<text x="${x}" y="${y}" text-anchor="${anchorPos || 'middle'}" font-size="9.5" font-weight="700"
      font-family="Inter,Helvetica,Arial,sans-serif" fill="${col.accent}" paint-order="stroke"
      stroke="${col.bg}" stroke-width="3.5" stroke-linejoin="round">${txt}</text>`;

  const arrow = (d, col, uid) =>
    Knot.S(d, col.accent, 2, `marker-end="url(#skA-${uid})" stroke-dasharray="0"`);

  /* ---- the three stages -------------------------------------------------- */
  function stages(col) {
    const t = col.tail;

    /* 1 -- the two loops. Same route as the finished knot's first half, so a
       reader who follows this stage is already holding the right shape. */
    const one = () => {
      const end = ' C144,146 152,140 157,133';
      return [
        Knot.cord(LOOP1 + LOOP2 + end, t, W),
        anchor(col),
        flush(FRONT1(false), t, W),
        flush(stub(L2.front), t, W),
        // the free end leaves loop 2 over the strand climbing the outside. Its
        // tip is a real end, so it gets a rounded, outlined cap: the outline
        // disc goes under the strand and the body disc on top of it
        `<circle cx="157" cy="133" r="${W / 2 + 0.9}" fill="${Knot.edgeFor(t)}"/>`,
        flush('M120,146 L134,146' + end, t, W, 'start'),
        `<circle cx="157" cy="133" r="${W / 2}" fill="${t}"/>`,
        arrow('M160,136 L172,124', col, 1),
        badge(14, 182, '1', col),
        badge(14, 130, '2', col),
        tag(A + 16, L2.front - 11, 'over the front', col, 'start'),
        tag(122, L1.back + 18, 'under the back', col, 'start')
      ].join('');
    };

    /* 2 -- the third wrap, taken all the way round, and the tail fed up
       through the two loops. The tail is drawn between the anchor and the
       front stubs, which IS the threading. */
    const two = () => [
      Knot.cord(LOOP1 + LOOP2 + CIRCUIT, t, W),
      anchor(col),
      flush(CROSS_OUT, t, W),
      flush(TAIL_LO, t, W, 'start'),
      flush(FRONT1(true), t, W),
      flush(stub(L2.front, true), t, W),
      flush(stub(TOP_Y), t, W),
      flush(TAIL_HI, t, W),
      // the tail's free end, rounded, where it leaves the top
      `<circle cx="${TAIL_X}" cy="30" r="${W / 2 + 0.9}" fill="${Knot.edgeFor(t)}"/>`,
      `<circle cx="${TAIL_X}" cy="30" r="${W / 2}" fill="${t}"/>`,
      arrow(`M${TAIL_X},44 L${TAIL_X},26`, col, 2),
      badge(A + 26, 30, '3', col),
      badge(105, 93, '4', col),
      tag(A + 40, 27, 'over, then', col, 'start'),
      tag(A + 40, 39, 'right round', col, 'start'),
      tag(116, 90, 'up through', col, 'start'),
      tag(116, 102, 'both loops', col, 'start')
    ].join('');

    /* 3 -- cinched. The wraps stack into a mass, and the whole point of the
       knot is the gap under it: it has to sit ON the grommet, not in it. */
    const three = () => {
      const edge = Knot.edgeFor(t);
      const grooves = [162, 174, 186].map(y =>
        `<path d="M54,${y} C68,${y - 3} 108,${y - 3} 122,${y}" fill="none" stroke="${edge}"
          stroke-opacity="0.55" stroke-width="1.6"/>`).join('');
      return [
        anchor(col),
        // the standing part runs from the grommet up into the mass
        Knot.cord(`M${TAIL_STAND},${MOUTH} C${TAIL_STAND},216 ${TAIL_STAND},212 100,204`, t, W),
        `<rect x="50" y="146" width="76" height="56" rx="25" fill="${t}" stroke="${edge}"
           stroke-width="2.6"/>`,
        `<rect x="56" y="152" width="26" height="44" rx="13" fill="#ffffff" opacity="0.10"/>`,
        grooves,
        // the tail is left LONG at this stage -- it is trimmed only after the
        // first cross has been pulled and the knot has held
        Knot.cord('M114,156 C130,144 146,126 158,98', t, W),
        `<circle cx="159" cy="96" r="${W / 2 + 1.2}" fill="${edge}"/>`,
        `<circle cx="159" cy="96" r="${W / 2 - 0.4}" fill="${t}"/>`,
        // the gap is the whole point: the knot sits ON the frame, not in it
        // the gap under the knot IS the point, so it gets the callout
        `<path d="M64,204 L64,${WALL - 1}" stroke="${col.accent}" stroke-width="1.5"
           stroke-dasharray="3 3" fill="none"/>`,
        `<path d="M57,204 L71,204 M57,${WALL - 1} L71,${WALL - 1}" stroke="${col.accent}"
           stroke-width="1.6" fill="none"/>`,
        `<path d="M62,232 L48,232" stroke="${col.accent}" stroke-width="1.3"
           stroke-dasharray="3 3" fill="none"/>`,
        tag(120, 82, 'leave the tail', col, 'end'),
        tag(6, 214, 'snug', col, 'start'),
        tag(6, 226, 'against', col, 'start'),
        tag(6, 238, 'grommet', col, 'start'),
        badge(22, 162, '5', col)
      ].join('');
    };

    /* ONE sequence of numbers, not two. The badges in the drawings run 1..5 --
       they are the five moves the hands make -- while the panels were headed
       1, 2, 3, so panel "1 Wrap it twice" contained badges 1 and 2, and panel
       "2" contained 3 and 4. Two numbering systems for one procedure, side by
       side. The moves keep the numbers, because they are what the reader is
       following; each panel now says which of them it shows. `n` survives as
       the stage's position for the accessible title and the marker id. */
    return [
      { n: 1, moves: '1 and 2', title: 'Wrap it twice',
        alt: 'The cross string comes up through the grommet beside an already-tensioned main, crosses '
           + 'in front of that main, passes round and behind it, and does the same a second time higher '
           + 'up, making two loops.',
        cap: 'The cross string comes up through the starting hole <b>alongside a main that is already '
           + 'tensioned</b>. Both strings share that hole. Take the loose end <b>over the front</b> of that main, '
           + 'around it, and back <b>under</b> it from behind. Do it again just above the first. Now you have two loops.',
        svg: one() },
      { n: 2, moves: '3 and 4', title: 'Third wrap, then through both loops',
        alt: 'The tail crosses in front of the anchor a third time, travels all the way around the '
           + 'outside, and is then fed up through both loops, passing under the front of each and out '
           + 'at the top.',
        cap: 'Take it <b>over the front</b> once more, then <b>all the way around</b>. That is the third '
           + 'wrap. Now feed the loose end <b>up through both loops</b> and out of the top.',
        svg: two() },
      { n: 3, moves: '5', title: 'Tighten it, and leave the tail',
        alt: 'Pulled tight, the wraps stack into a bulky knot on the stringbed side, snug against the '
           + 'grommet. The tail is left long, not yet trimmed.',
        /* Trimming here was the old advice and it was wrong: the knot has not
           been loaded yet. Cut the tail now and a knot that creeps on the first
           pull cannot be retied. */
        cap: 'Pull the loose end by hand until the wraps bunch up into a <b>bulky</b> knot on the '
           + '<b>stringbed side</b>, snug against the grommet. <b>Leave the tail long</b>. The knot has not been tested by a tension pull yet, '
           + 'and you may need to tie it again.',
        svg: three() }
    ];
  }

  /* One stage on screen at a time, like the finishing knot: the diagram on
     the left, the three stages listed on the right, and the open one's words
     under its title. All three stay in the page; only the open one shows. */
  let open = 0;
  function html(col) {
    const S = stages(col);
    return `<ol class="sk-stages">` + S.map((s, i) => `
      <li class="sk-stage${i === open ? ' on' : ''}${i < open ? ' past' : ''}" data-sk="${i}">
        <svg class="sk-svg" viewBox="${VB}" role="img" aria-labelledby="skT${s.n} skD${s.n}">
          <title id="skT${s.n}">Starting knot, stage ${s.n} of 3: ${s.title}</title>
          <desc id="skD${s.n}">${s.alt}</desc>
          <defs><marker id="skA-${s.n}" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" fill="${col.accent}"/></marker></defs>
          ${scenery(col, { noAnchorLabel: s.n !== 1 })}
          ${ferrule(col)}
          ${s.svg}
        </svg>
        <h4 class="sk-t"><button type="button" class="sk-b" aria-expanded="${i === open}">
          <span class="sk-dot">${s.n}</span>${s.title}<span class="sk-n">${s.moves}</span></button></h4>
        <p class="sk-cap">${s.cap}</p>
      </li>`).join('') + `
      <li class="sk-nav">
        <button type="button" class="btn ghost" data-skn="-1">Previous move</button>
        <span class="knot-count"></span>
        <button type="button" class="btn primary" data-skn="1">Next move</button>
      </li></ol>`;
  }

  function show(root, i) {
    const items = [...root.querySelectorAll('.sk-stage')];
    open = Math.max(0, Math.min(items.length - 1, i));
    items.forEach((li, k) => {
      li.classList.toggle('on', k === open);
      li.classList.toggle('past', k < open);
      li.querySelector('.sk-b').setAttribute('aria-expanded', k === open ? 'true' : 'false');
    });
    root.querySelector('.sk-nav .knot-count').textContent = `Move ${open + 1} of ${items.length}`;
    root.querySelector('[data-skn="-1"]').disabled = open === 0;
    const nx = root.querySelector('[data-skn="1"]');
    nx.disabled = open === items.length - 1;
    nx.textContent = open === items.length - 1 ? 'Last move' : 'Next move';
  }

  /* render into `root` and wire it; safe to call again when colours change */
  function mount(root, col) {
    root.innerHTML = html(col);
    show(root, open);
    if (root.dataset.skBound) return;
    root.dataset.skBound = '1';
    root.addEventListener('click', e => {
      const b = e.target.closest('.sk-b');
      if (b) { show(root, +b.closest('.sk-stage').dataset.sk); return; }
      const n = e.target.closest('[data-skn]');
      if (n) show(root, open + Number(n.dataset.skn));
    });
  }

  return { html, mount };
})();
