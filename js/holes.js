/* Two close-ups of the top right corner of a hoop, opened from the steps:
 *
 *   grommets -- which holes are for mains and which for crosses. A main's
 *               grommet points up and down, along the main. A cross's points
 *               sideways. Near the corner the difference is small, which is
 *               where people put a main in a cross hole.
 *   start    -- where the starting knot goes on a two piece: around the
 *               outermost main in its hole, then along the outside of the frame
 *               to the first cross hole.
 *
 * Illustrative, not a particular frame: the frame's own markings decide the
 * exact holes, and the captions say so.
 */
const Holes = (function () {

  const VW = 420, VH = 290;          // room on the right, outside the hoop, for labels
  const CX = 30, CY = 262;             // centre of the quarter ellipse
  const RX = 272, RY = 212;            // the hoop's inner edge
  const BEAM = 22;                     // frame depth, inner to outer edge
  const FRAME = '#3a4049', FRAME_EDGE = '#59616c', MAIN = '#9aa3b0', CROSS = '#f2f0ea';
  const EDGE = '#05070a', ACCENT = '#4cc9e0', WARN = '#e8b268', HOLE = '#9aa3b0';

  const f = n => Math.round(n * 10) / 10;
  // a point on the inner edge (b = 0) or out into the beam (b > 0), at angle t
  const at = (t, b) => [CX + (RX + b) * Math.cos(t), CY - (RY + b) * Math.sin(t)];
  // the angle where a vertical main at x, or a horizontal cross at y, meets the hoop
  const tMain = x => Math.acos((x - CX) / RX);
  const tCross = y => Math.asin((CY - y) / RY);

  const arc = b => {
    const pts = [];
    for (let i = 0; i <= 48; i++) { const p = at((Math.PI / 2) * (i / 48), b); pts.push(`${f(p[0])},${f(p[1])}`); }
    return 'M' + pts.join(' L');
  };
  const frame = () =>
    `<path d="${arc(BEAM / 2)}" fill="none" stroke="${FRAME}" stroke-width="${BEAM}"/>
     <path d="${arc(0)}" fill="none" stroke="${FRAME_EDGE}" stroke-width="1.5"/>
     <path d="${arc(BEAM)}" fill="none" stroke="${FRAME_EDGE}" stroke-width="1.5"/>`;

  const strand = (d, col, w) =>
    `<path d="${d}" stroke="${EDGE}" stroke-width="${w + 2}" stroke-linecap="round" fill="none"/>` +
    `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

  /* A grommet: a short barrel through the beam, lying along the string that
     uses it. `dir` is 'v' for a main (up and down) or 'h' for a cross. */
  const grommet = (x, y, dir, col) => dir === 'v'
    ? `<rect x="${f(x - 4)}" y="${f(y - 17)}" width="8" height="20" rx="3" fill="${col || HOLE}" stroke="${EDGE}" stroke-width="1.2"/>`
    : `<rect x="${f(x - 3)}" y="${f(y - 4)}" width="20" height="8" rx="3" fill="${col || HOLE}" stroke="${EDGE}" stroke-width="1.2"/>`;

  const MAIN_XS = [0, 1, 2, 3, 4, 5, 6, 7].map(k => CX + 16 + k * 27);   // mains across the top
  const CROSS_YS = [0, 1, 2, 3, 4].map(j => 132 + j * 28);             // crosses down the side

  const tag = (x, y, t, col, anchor) =>
    `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor || 'start'}" class="ho-t" fill="${col || ACCENT}">${t}</text>`;

  /* ---- grommets: main vs cross, at the corner --------------------------- */
  /* Closer in than the other view, on the corner itself. This is where main and
     cross holes take turns along the frame, and where the outer mains skip a
     hole because it belongs to a cross: a 16x19's mains skip holes 7 and 9 at
     each end. The skipped holes are the thing to see. */
  function grommetsSvg() {
    const cx = -40, cy = 372, rx = 400, ry = 330, beam = 26;   // a bigger, closer ellipse
    const pt = (t, b) => [cx + (rx + b) * Math.cos(t), cy - (ry + b) * Math.sin(t)];
    const band = b => { const q = []; for (let k = 0; k <= 40; k++) { const t = 0.18 + (1.42 - 0.18) * k / 40; const p = pt(t, b); q.push(`${f(p[0])},${f(p[1])}`); } return 'M' + q.join(' L'); };
    let s = `<path d="${band(beam / 2)}" fill="none" stroke="${FRAME}" stroke-width="${beam}"/>
      <path d="${band(0)}" fill="none" stroke="${FRAME_EDGE}" stroke-width="1.5"/>
      <path d="${band(beam)}" fill="none" stroke="${FRAME_EDGE}" stroke-width="1.5"/>`;
    // holes along the corner, from the top towards the side
    const seq = [
      { k: 'M', n: 5 }, { k: 'M', n: 6 }, { k: 'C', skip: true }, { k: 'M', n: 7 },
      { k: 'C', skip: true }, { k: 'M', n: 8 }, { k: 'C' }, { k: 'C' }, { k: 'C' }
    ];
    const t0 = 1.30, dt = 0.118;
    const holes = seq.map((h, i) => Object.assign({ t: t0 - i * dt }, h));
    // the crosses run out through their sideways holes, the mains up through theirs
    holes.forEach(h => {
      const p = pt(h.t, 0);
      if (h.k === 'C') s += strand(`M-4,${f(p[1])} L${f(p[0])},${f(p[1])}`, CROSS, 4);
    });
    holes.forEach(h => {
      const p = pt(h.t, 0);
      if (h.k === 'M') s += strand(`M${f(p[0])},${VH} L${f(p[0])},${f(p[1])}`, MAIN, 4);
    });
    holes.forEach(h => {
      const p = pt(h.t, 0);
      const col = h.skip ? WARN : h.n === 7 ? ACCENT : null;
      s += grommet(p[0], p[1], h.k === 'M' ? 'v' : 'h', col);
    });
    const badge = (x, y, n, col) =>
      `<circle cx="${f(x)}" cy="${f(y)}" r="12" fill="#0b0e12" stroke="${col}" stroke-width="1.6"/>
       <text x="${f(x)}" y="${f(y + 4.5)}" text-anchor="middle" class="ho-n" fill="${col}">${n}</text>`;
    // 1: main 7's hole (vertical). 2: the skipped hole before it (sideways, a cross's)
    const m7 = holes.find(h => h.n === 7), sk = holes.find(h => h.skip);
    const a = pt(m7.t, beam + 18), b = pt(sk.t, beam + 18);
    s += badge(a[0], a[1], 1, ACCENT) + badge(b[0], b[1], 2, WARN);
    return svg(s, 'A close-up of the corner of a hoop. Main holes point up and down and cross holes point sideways, and they alternate. Main 7 skips a sideways cross hole and uses the next up and down hole.');
  }

  /* ---- where the starting knot goes ------------------------------------ */
  function startSvg() {
    let behind = '';
    let s = '';
    // the mains are already strung
    MAIN_XS.forEach(x => {
      const p = at(tMain(x), 0);
      s += strand(`M${f(x)},${VH} L${f(x)},${f(p[1])}`, MAIN, 4);
    });
    // cross holes from the first cross down: none sits unused above it
    CROSS_YS.slice(1).forEach(y => { const p = at(tCross(y), 0); s += grommet(p[0], y, 'h'); });

    // two candidates for the starting hole: the outermost main's hole, or the one next to it
    const xa = MAIN_XS[MAIN_XS.length - 1], xb = MAIN_XS[MAIN_XS.length - 2];
    const ta = tMain(xa), tb = tMain(xb);
    const yc = CROSS_YS[1], tc = tCross(yc);   // a hole down from the corner, so the steps have room
    const cIn = at(tc, 0), cOut = at(tc, BEAM + 3);
    /* The knot sits on the stringbed side, just below the grommet's inner end,
       tied around the main where it comes out of the frame. The string goes up
       through the grommet from there and along the outside of the frame. */
    const hole = at(ta, 0);
    const knot = [xa + 1, hole[1] + 11];
    const pts = [];
    for (let i = 0; i <= 16; i++) { const t = ta + (tc - ta) * (i / 16); const p = at(t, BEAM + 3); pts.push(`${f(p[0])},${f(p[1])}`); }
    const top = at(ta, BEAM + 3);
    // through the frame and round the outside: drawn behind the frame, so the part
    // inside the beam is hidden and only the run outside the frame shows
    behind += strand(`M${f(xa + 2)},${f(knot[1])} L${f(xa + 2)},${f(top[1])} L` + pts.join(' L'), CROSS, 3.5);
    MAIN_XS.forEach(x => {
      const p = at(tMain(x), 0);
      s += grommet(x, p[1], 'v', x === xa || x === xb ? ACCENT : null);
    });
    s += `<ellipse cx="${f(knot[0])}" cy="${f(knot[1])}" rx="8" ry="6" fill="${CROSS}" stroke="${EDGE}" stroke-width="1.6"/>
          <path d="M${f(knot[0] - 5)},${f(knot[1] - 1)} q5,-3 10,0 M${f(knot[0] - 5)},${f(knot[1] + 2.5)} q5,-3 10,0"
            stroke="${EDGE}" stroke-opacity=".5" stroke-width="1.1" fill="none"/>`;
    // 3: in through the first cross hole and across as the first cross
    behind += strand(`M${f(cOut[0])},${f(yc)} L${f(cIn[0])},${f(yc)}`, CROSS, 4);
    s += strand(`M${f(cIn[0])},${f(yc)} L${CX - 30},${f(yc)}`, CROSS, 4);
    s += grommet(cIn[0], yc, 'h', WARN);
    // a bracket round the two candidate holes, outside the frame
    const ba = at(ta, BEAM + 16), bb = at(tb, BEAM + 16);
    s += `<path d="M${f(bb[0])},${f(bb[1] + 6)} L${f(bb[0])},${f(bb[1])} L${f(ba[0])},${f(ba[1])} L${f(ba[0])},${f(ba[1] + 6)}"
      fill="none" stroke="${ACCENT}" stroke-width="1.5"/>`;
    const badge = (x, y, n, col) =>
      `<circle cx="${f(x)}" cy="${f(y)}" r="12" fill="#0b0e12" stroke="${col || ACCENT}" stroke-width="1.6"/>
       <text x="${f(x)}" y="${f(y + 4.5)}" text-anchor="middle" class="ho-n" fill="${col || ACCENT}">${n}</text>`;
    // only the numbers sit in the drawing; the words are in the list beside it
    s += badge((ba[0] + bb[0]) / 2, Math.min(ba[1], bb[1]) - 14, 1);
    const mid = at((ta + tc) / 2, BEAM + 22);
    s += badge(mid[0], mid[1], 2);
    s += badge(cOut[0] + 20, yc, 3, WARN);
    s = behind + frame() + s;
    return svg(s, 'A close-up of the top right of a hoop with the mains strung. One: the starting hole is one of the two outermost main holes, and the knot sits just below the grommet on the stringbed side. Two: the string runs along the outside of the frame. Three: it goes in through the first cross hole and across.');
  }

  const svg = (body, aria) => `<svg class="ho-svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${aria}">${body}</svg>`;

  const CONTENT = {
    grommets: {
      title: 'Main hole or cross hole?',
      art: grommetsSvg,
      text: `<ol class="ho-steps">
        <li><b>A main hole</b> points up and down, along the main.</li>
        <li><b>A cross hole</b> points sideways, along the cross. These can sit between the holes of the
          mains, so make sure to <b>skip</b> them when stringing the mains.</li>
      </ol>
      <p class="ho-note">This shows the idea, not your racket. Your frame's pattern lists its skipped holes.</p>`
    },
    start: {
      title: 'Where the starting knot goes',
      art: startSvg,
      text: `<ol class="ho-steps">
        <li><b>Starting hole.</b> Usually the outermost main's hole or the one next to it, both
          highlighted. Not every frame marks it, but that grommet is usually slightly bigger. Feed the
          cross string through it beside the main and tie the starting knot around the main. The knot
          sits just below the grommet, on the stringbed side, tied around the main.</li>
        <li><b>Along the outside.</b> Run the string along the outside of the frame.</li>
        <li><b>First cross hole.</b> Go in through the first cross hole and weave the first cross.</li>
      </ol>
      <p><button type="button" class="linkbtn" data-goto="knot" data-knot="start">See how to tie the starting knot</button></p>
      <p class="ho-note">This shows the idea, not your racket.</p>`
    }
  };

  function hostEl() {
    let h = document.getElementById('holesModal');
    if (!h) { h = document.createElement('div'); h.className = 'modal'; h.id = 'holesModal'; document.body.appendChild(h); }
    return h;
  }

  function open(kind) {
    const c = CONTENT[kind] || CONTENT.grommets;
    const host = hostEl();
    const restore = document.activeElement;
    host.innerHTML = `
      <div class="modal-back"></div>
      <div class="modal-card ho-card" role="dialog" aria-modal="true" aria-label="${c.title}" tabindex="-1">
        <button class="modal-x" aria-label="Close">&times;</button>
        <h2 class="ho-h">${c.title}</h2>
        <div class="ho-grid"><div class="ho-art">${c.art()}</div><div class="ho-text">${c.text}</div></div>
      </div>`;
    const close = () => {
      host.classList.remove('on');
      document.removeEventListener('keydown', esc);
      if (restore && restore.focus) restore.focus();
    };
    const esc = e => { if (e.key === 'Escape') close(); };
    host.querySelector('.modal-x').addEventListener('click', close);
    host.querySelector('.modal-back').addEventListener('click', close);
    document.addEventListener('keydown', esc);
    host.classList.add('on');
    host.querySelector('.modal-card').focus();
  }

  return { open, grommetsSvg, startSvg };
})();
