/* The beginner setup wizard.
 *
 * It does NOT hold a configuration of its own. It collects answers into a
 * draft, and on Start it hands them to the app's own state in one go. A second
 * parallel model would be a second thing to keep in sync, and the two would
 * drift the moment anything else changed the bench.
 */
const Wizard = (function () {

  const el = id => document.getElementById(id);
  let host, draft, onDone, onCancel, stepIx = 0;

  /* Purpose is always 'practice' and the method always two piece. Both are
     still sent on Start so the app's handler gets the fields it reads. */
  const STEPS = ['racket', 'machine', 'string', 'review'];
  const TITLES = {
    racket:  'Your racket',
    machine: 'What are you stringing on?',
    string:  'What kind of string?',
    review:  'Check it over'
  };

  const rk = () => makeFrame(draft);
  const sg = () => STRINGS.find(s => s.type === draft.kind) || STRINGS[0];
  /* Only the kind is asked. Synthetic gut is the one to learn on. */
  const KINDS = ['Synthetic gut', 'Multifilament', 'Polyester', 'Natural gut'];
  const mid = () => 55;   // a sensible middle tension for any frame

  /* A small segmented control, the same one the Your racket tab uses */
  const seg = (name, label, opts) => `<div class="seg ${name === 'pattern' ? 'grid3' : 'sets-seg'}"
      role="radiogroup" aria-label="${label}">${opts.map(o => {
        const on = String(draft[name]) === String(o.v);
        return `<button type="button" role="radio" class="${on ? 'on' : ''}" aria-checked="${on}"
          data-set="${name}" data-val="${o.v}">${o.t}</button>`;
      }).join('')}</div>`;

  /* ---------------- the panes ---------------- */

  function paneChoice(name, opts) {
    return `<div class="wz-choices" role="radiogroup" aria-label="${TITLES[STEPS[stepIx]]}">${
      opts.map(o => `
        <button type="button" class="wz-choice ${draft[name] === o.v ? 'on' : ''}"
          role="radio" aria-checked="${draft[name] === o.v ? 'true' : 'false'}"
          data-set="${name}" data-val="${o.v}">
          <b>${o.t}</b>${o.d ? `<span>${o.d}</span>` : ''}
        </button>`).join('')}</div>`;
  }

  const panes = {
    /* The three things read off the frame, on one screen */
    racket: () => `
        <div class="wz-q"><h4>String pattern</h4>
          ${seg('pattern', 'String pattern', FRAME_PATTERNS.map(p => ({ v: p, t: p })))}
          <p class="hint">Printed on the frame, usually inside the throat or on the shaft.</p></div>
        <div class="wz-q"><h4>Hole sets at the throat</h4>
          ${seg('throatPairs', 'Hole sets at the throat', [3, 4].map(n => ({ v: n, t: n + ' sets' })))}
          <p class="hint">3 sets: the mains start at the throat. 4 sets: they start at the head.</p></div>
        <div class="wz-q"><h4>Head size <em class="opt">Optional</em></h4>
          <label class="fld"><span class="sr-only">Head size</span><select id="wzHead">
            <option value="">Not sure (${DEFAULT_HEAD} sq in)</option>${HEAD_SIZES.map(h =>
              `<option value="${h}" ${draft.headSize === h ? 'selected' : ''}>${h} sq in</option>`).join('')}
          </select></label></div>`,

    machine: () => paneChoice('machineType', Job.MACHINES.map(m =>
      ({ v: m.id, t: m.name, d: m.clamp }))),

    string: () => paneChoice('kind', KINDS.map(k => ({
      v: k, t: k, d: k === 'Synthetic gut' ? 'Recommended' : ''
    }))) + (draft.kind === 'Synthetic gut'
      ? '<p class="hint">Cheap and easy to weave, so good for learning.</p>' : ''),

    review: () => {
      const r = rk(), s = sg();
      const bed = Geo.buildStringbed(r, r.pattern);
      const st = Geo.stats(r, bed, draft.tMain, draft.tCross, s, s, draft.gauge, draft.gauge);
      const strung = plane => `${s.name} · ${draft.gauge.toFixed(2)} mm · ${plane} lb`;
      return `
        <dl class="wz-facts wz-review">
          <div><dt>Racket</dt><dd>${bed.patternLabel} · mains start at the ${mainsStartOf(r.throatPairs)}</dd></div>
          <div><dt>Machine</dt><dd>${Job.machine(draft.machineType).name}</dd></div>
          <div><dt>Mains</dt><dd>${strung(draft.tMain)}</dd></div>
          <div><dt>Crosses</dt><dd>${strung(draft.tCross)}</dd></div>
          <div><dt>Method</dt><dd>${draft.method === 'one' ? 'One piece · 2 knots' : 'Two piece · 4 knots'}</dd></div>
          <div><dt>Cut</dt><dd>${Fmt.metres(Fmt.cutFor(st, draft.method === 'one'))}</dd></div>
        </dl>`;
    }
  };

  /* ---------------- shell ---------------- */

  function render() {
    const name = STEPS[stepIx], last = stepIx === STEPS.length - 1;
    host.innerHTML = `
      <div class="wz-head">
        <p class="wz-count">Setup ${stepIx + 1} of ${STEPS.length}</p>
        <h3>${TITLES[name]}</h3>
      </div>
      <div class="wz-body">${panes[name]()}</div>
      <div class="wz-nav">
        ${stepIx ? '<button type="button" class="btn ghost" data-wz="back">Back</button>' : ''}
        <button type="button" class="btn primary" data-wz="next">${last ? 'Start stringing' : 'Next'}</button>
      </div>`;
    /* on the review the next move is Start, so focus goes there */
    const first = last ? host.querySelector('[data-wz=next]')
      : host.querySelector('.wz-choice, select, button');
    if (first) first.focus();
  }

  /* The thickness and tension follow the kind and the racket, so going back
     and changing either moves them with it. */
  function applyRecommendation() {
    const r = rk(), s = sg();
    draft.mainId = draft.crossId = s.id;
    draft.gauge = s.gauge;
    draft.tMain = draft.tCross = mid(r);
  }

  function handle(e) {
    const set = e.target.closest('[data-set]');
    if (set) {
      const k = set.dataset.set, v = set.dataset.val;
      draft[k] = k === 'throatPairs' ? +v : v;
      applyRecommendation();
      render();
      return;
    }
    const nav = e.target.closest('[data-wz]');
    if (!nav) return;
    /* Back on the first question closes the guide */
    if (nav.dataset.wz === 'back') {
      if (!stepIx) { onCancel(); return; }
      stepIx--; render(); return;
    }
    if (stepIx < STEPS.length - 1) { stepIx++; render(); return; }
    onDone(Object.assign({}, draft));
  }

  function change(e) {
    if (e.target.id === 'wzHead') {
      draft.headSize = e.target.value ? +e.target.value : null;
      applyRecommendation();
      render();
    }
  }

  function open(mount, current, done, cancel) {
    host = mount; onDone = done; onCancel = cancel; stepIx = 0;
    const f = makeFrame(current);
    draft = {
      purpose: 'practice', pattern: f.pattern, throatPairs: f.throatPairs,
      headSize: current.headSize || null,
      machineType: current.machineType || 'dropweight',
      kind: 'Synthetic gut', method: 'two'
    };
    applyRecommendation();
    if (!host._wired) {
      host.addEventListener('click', handle);
      host.addEventListener('change', change);
      host._wired = true;
    }
    render();
  }

  return { open, STEPS };
})();
