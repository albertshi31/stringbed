/* The weaving quiz: five quick questions on whether a cross goes over or
 * under, each with a close-up drawing of a few mains and one or two crosses.
 *
 * Three kinds of question, all from the one rule a weaver runs on:
 *   next  -- this cross went over (or under) the last main. What next?
 *   row   -- the cross above goes over this main. What does this one do here?
 *   check -- here is a finished cross. Is it woven right?
 *
 * The drawing is its own small SVG, not the racket renderer: a close-up of six
 * mains reads far better than a zoomed racket, and it can mark the one spot
 * the question is about.
 */
const WeaveQuiz = (function () {

  const N = 6;                         // mains in the close-up
  const X0 = 112, DX = 50;             // first main's x, spacing: room on the left for the labels
  const VW = 420, VH = 180;            // wide and short, so it fills the quiz's width on any screen
  const PREV_Y = 56, CUR_Y = 118;      // the cross above, and the one being woven
  const MAIN = '#9aa3b0', CROSS = '#f2f0ea', EDGE = '#05070a', ACCENT = '#4cc9e0';
  const ROUNDS = 5;

  const CLOSE = { n: N, x0: X0, dx: DX, wm: 6, wc: 7, r: 15 };
  const WHOLE = { n: 16, x0: 96, dx: 20.4, wm: 4, wc: 5, r: 10 };
  let L = CLOSE;                       // the layout being drawn
  const mx = i => L.x0 + i * L.dx;
  const flip = w => (w === 'over' ? 'under' : 'over');
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const alternating = (start, n) => Array.from({ length: n }, (_, i) => (i % 2 ? flip(start) : start));

  /* One strand with an outline, the way the rest of the app draws string. */
  const strand = (d, col, w) =>
    `<path d="${d}" stroke="${EDGE}" stroke-width="${w + 2}" stroke-linecap="round" fill="none"/>` +
    `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

  /* A cross across the mains. `pattern[i]` is how it meets main i; it is drawn
     up to `upTo` mains (all of them when omitted). Where it goes UNDER, a short
     piece of the main is struck again on top, which is what under looks like. */
  function cross(y, pattern, upTo) {
    const n = upTo === undefined ? pattern.length : upTo;
    if (n <= 0) return '';
    const x1 = n >= L.n ? mx(L.n - 1) + 16 : mx(n - 1) + L.dx * 0.55;
    let out = strand(`M${mx(0) - 16},${y} L${x1},${y}`, CROSS, L.wc);
    const h = L.wc + 2;
    for (let i = 0; i < n; i++) {
      if (pattern[i] === 'under') out += strand(`M${mx(i)},${y - h} L${mx(i)},${y + h}`, MAIN, L.wm);
    }
    // a small arrow on the loose end shows which way the weave is heading
    if (n < L.n) {
      out += `<path d="M${x1 + 4},${y - 6} l8,6 l-8,6" fill="none" stroke="${ACCENT}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return out;
  }

  function mains(numbered) {
    let out = Array.from({ length: L.n }, (_, i) => strand(`M${mx(i)},18 L${mx(i)},${VH - 30}`, MAIN, L.wm)).join('');
    if (numbered) {
      out += Array.from({ length: L.n }, (_, i) =>
        `<text x="${mx(i)}" y="${VH - 12}" text-anchor="middle" class="wq-n">${i + 1}</text>`).join('');
    }
    return out;
  }

  /* the spot the question is about */
  const ring = (i, y) =>
    `<circle cx="${mx(i)}" cy="${y}" r="${L.r}" fill="none" stroke="${ACCENT}" stroke-width="2.2"
      stroke-dasharray="4 3"/>
     <circle cx="${mx(i)}" cy="${y - L.r - 16}" r="10" fill="#0b0e12" stroke="${ACCENT}" stroke-width="1.8"/>
     <text x="${mx(i)}" y="${y - L.r - 11.5}" text-anchor="middle" class="wq-q">?</text>`;

  const label = (y, t) => `<text x="6" y="${y + 4}" class="wq-l">${t}</text>`;

  /* body is a function, so it is drawn in the layout it is given */
  const svg = (layout, body, aria) => {
    L = layout;
    const out = `<svg class="wq-svg" viewBox="0 0 ${VW} ${VH}" role="img"
      aria-label="${aria}">${mains(layout === WHOLE)}${body()}</svg>`;
    L = CLOSE;
    return out;
  };

  /* ---- the three kinds of question ------------------------------------ */
  function qNext() {
    const k = 2 + Math.floor(Math.random() * 3);           // 2 to 4 mains already done
    const pat = alternating(pick(['over', 'under']), N);
    const last = pat[k - 1];
    return {
      prompt: `This cross went <b>${last}</b> the last main it crossed. At the next main, does it go over or under?`,
      art: svg(CLOSE, () => cross(CUR_Y, pat, k) + ring(k, CUR_Y) + label(CUR_Y, 'this cross'),
        `A cross woven across ${k} mains, ending ${last} the last one. The next main is marked.`),
      choices: ['over', 'under'], answer: pat[k],
      why: `A cross swaps at every main. After <b>${last}</b> comes <b>${pat[k]}</b>.`
    };
  }

  function qRow() {
    const prev = alternating(pick(['over', 'under']), N);
    const cur = prev.map(flip);
    const k = 1 + Math.floor(Math.random() * 4);           // ask at main 2 to 5
    return {
      prompt: `The cross above goes <b>${prev[k]}</b> the marked main. What does this cross do there?`,
      art: svg(CLOSE, () => cross(PREV_Y, prev) + label(PREV_Y, 'cross above') + cross(CUR_Y, cur, k) + ring(k, CUR_Y)
          + label(CUR_Y, 'this cross'),
        `The cross above is woven all the way across. The cross below is woven up to the marked main.`),
      choices: ['over', 'under'], answer: cur[k],
      why: `Each cross does the opposite of the one above it. That one goes <b>${prev[k]}</b>, so this one goes <b>${cur[k]}</b>.`
    };
  }

  function qCheck() {
    const pat = alternating(pick(['over', 'under']), N);
    const wrong = Math.random() < 0.55;
    let bad = -1;
    if (wrong) { bad = 1 + Math.floor(Math.random() * (N - 1)); pat[bad] = pat[bad - 1]; }
    return {
      prompt: 'Is this cross woven correctly?',
      art: svg(CLOSE, () => cross(CUR_Y, pat) + label(CUR_Y, 'this cross'), 'A cross woven all the way across six mains.'),
      choices: ['correct', 'mistake'], answer: wrong ? 'mistake' : 'correct',
      reveal: wrong ? svg(CLOSE, () => cross(CUR_Y, pat) + ring(bad, CUR_Y) + label(CUR_Y, 'this cross'),
        'The same cross with the mistake marked.') : '',
      why: wrong
        ? `It goes <b>${pat[bad]}</b> two mains in a row at the marked spot. It should swap every time.`
        : 'It swaps over and under at every main, so it is right.'
    };
  }

  /* ---- the whole cross: how it starts decides how it finishes ---------- */
  const M = 16;                                       // a 16-main frame, every main drawn
  const RULE = `With ${M} mains, a cross that starts <b>under</b> the first main finishes <b>over</b> the last one, and vice versa.`;

  function qEnds() {
    const start = pick(['over', 'under']);
    const pat = alternating(start, M);
    const wrong = Math.random() < 0.6;
    let bad = -1;
    // a missed main somewhere in the middle: from there on it is one out of step
    if (wrong) { bad = 4 + Math.floor(Math.random() * 8); for (let i = bad; i < M; i++) pat[i] = flip(pat[i]); }
    const end = pat[M - 1];
    return {
      prompt: `This cross started <b>${start}</b> main 1 and finished <b>${end}</b> main ${M}. Is it woven correctly?`,
      art: svg(WHOLE, () => cross(CUR_Y, pat) + label(CUR_Y, 'this cross'), `A cross across all ${M} mains.`),
      choices: ['correct', 'mistake'], answer: wrong ? 'mistake' : 'correct',
      reveal: wrong ? svg(WHOLE, () => cross(CUR_Y, pat) + ring(bad, CUR_Y) + label(CUR_Y, 'this cross'),
        'The same cross with the missed main marked.') : '',
      why: wrong
        ? `${RULE} It started and finished <b>${start}</b>, so a main was missed. The marked spot goes ${pat[bad]} two in a row.`
        : `${RULE} It started <b>${start}</b> and finished <b>${end}</b>, so it is right.`
    };
  }

  function qFinish() {
    const start = pick(['over', 'under']);
    const pat = alternating(start, M);
    return {
      prompt: `This cross starts <b>${start}</b> main 1. How must it finish on main ${M}?`,
      art: svg(WHOLE, () => cross(CUR_Y, pat, 4) + ring(M - 1, CUR_Y) + label(CUR_Y, 'this cross'),
        `A cross starting ${start} the first of ${M} mains. The last main is marked.`),
      choices: ['over', 'under'], answer: flip(start),
      why: `${RULE} So it starts <b>${start}</b> and finishes <b>${flip(start)}</b>.`
    };
  }

  const KINDS = [qNext, qRow, qCheck, qEnds, qFinish];

  /* ---- the modal -------------------------------------------------------- */
  function hostEl() {
    let h = document.getElementById('weaveModal');
    if (!h) {
      h = document.createElement('div');
      h.className = 'modal'; h.id = 'weaveModal';
      document.body.appendChild(h);
    }
    return h;
  }

  function open() {
    const host = hostEl();
    const restore = document.activeElement;
    // every kind at least once, then fill the round at random
    const kinds = KINDS.slice().concat(Array.from({ length: ROUNDS - KINDS.length }, () => pick(KINDS)))
      .sort(() => Math.random() - 0.5);
    let i = 0, score = 0, q = null, answered = false;

    host.innerHTML = `
      <div class="modal-back"></div>
      <div class="modal-card wq-card" role="dialog" aria-modal="true" aria-label="Weaving quiz" tabindex="-1">
        <button class="modal-x" aria-label="Close">&times;</button>
        <div class="wq-body"></div>
      </div>`;
    const body = host.querySelector('.wq-body');

    const label = c => c.charAt(0).toUpperCase() + c.slice(1);
    function show() {
      q = kinds[i](); answered = false;
      body.innerHTML = `
        <p class="wq-count">Question ${i + 1} of ${ROUNDS}</p>
        <h2 class="wq-h">${q.prompt}</h2>
        <div class="wq-art">${q.art}</div>
        <div class="wq-choices">${q.choices.map(c =>
          `<button type="button" class="btn ghost wq-c" data-c="${c}">${label(c)}</button>`).join('')}</div>
        <p class="wq-why" role="status" aria-live="polite"></p>
        <div class="wq-next" hidden><button type="button" class="btn primary" data-next>
          ${i === ROUNDS - 1 ? 'See my score' : 'Next question'}</button></div>`;
      body.querySelector('.wq-c').focus();
    }
    function finish() {
      const msg = score === ROUNDS ? 'Perfect. You are ready to weave.'
        : score >= ROUNDS - 1 ? 'Nearly perfect. Watch the swap at every main.'
        : 'Keep at it. The rule is: swap at every main, and do the opposite of the cross above.';
      body.innerHTML = `
        <p class="wq-count">Quiz done</p>
        <h2 class="wq-h">${score} of ${ROUNDS} right</h2>
        <p class="wq-why">${msg}</p>
        <div class="wq-next"><button type="button" class="btn primary" data-again>Try again</button>
          <button type="button" class="btn ghost" data-close>Close</button></div>`;
      body.querySelector('[data-again]').focus();
    }

    body.addEventListener('click', e => {
      const c = e.target.closest('[data-c]');
      if (c && !answered) {
        answered = true;
        const right = c.dataset.c === q.answer;
        if (right) score++;
        body.querySelectorAll('[data-c]').forEach(b => {
          b.disabled = true;
          if (b.dataset.c === q.answer) b.classList.add('wq-right');
          else if (b === c) b.classList.add('wq-wrong');
        });
        if (q.reveal) body.querySelector('.wq-art').innerHTML = q.reveal;
        body.querySelector('.wq-why').innerHTML = (right ? '<b class="wq-yes">Right.</b> ' : '<b class="wq-no">Not quite.</b> ') + q.why;
        body.querySelector('.wq-next').hidden = false;
        body.querySelector('[data-next]').focus();
        return;
      }
      if (e.target.closest('[data-next]')) { i++; if (i < ROUNDS) show(); else finish(); return; }
      if (e.target.closest('[data-again]')) { i = 0; score = 0; show(); return; }
      if (e.target.closest('[data-close]')) close();
    });

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
    show();
  }

  return { open, KINDS: { qNext, qRow, qCheck, qEnds, qFinish } };
})();
