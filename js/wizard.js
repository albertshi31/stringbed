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
    racket:  'Which racket?',
    machine: 'What are you stringing on?',
    string:  'What kind of string?',
    review:  'Check it over'
  };

  const rk = () => RACKETS.find(r => r.id === draft.racketId);
  const sg = () => STRINGS.find(s => s.type === draft.kind) || STRINGS[0];
  /* Only the kind is asked. Synthetic gut is the one to learn on. */
  const KINDS = ['Synthetic gut', 'Multifilament', 'Polyester', 'Natural gut'];
  const mid = r => Math.round((r.tension[0] + r.tension[1]) / 2);
  /* the same name the bench uses: no version suffix */
  const modelName = racketName;
  const label = r => `${modelName(r)} · ${r.pattern}`;

  /* One group per brand, models sorted by name. Pattern and head size ride
     along because two frames can share a name (a 16x19 and an 18x20). */
  function racketOptions() {
    const brands = [...new Set(RACKETS.map(r => r.brand))].sort();
    return brands.map(b => `<optgroup label="${b}">${RACKETS
      .filter(r => r.brand === b)
      .sort((x, y) => label(x).localeCompare(label(y), undefined, { numeric: true }))
      .map(x => `<option value="${x.id}" ${x.id === draft.racketId ? 'selected' : ''}>${label(x)}</option>`)
      .join('')}</optgroup>`).join('');
  }

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
    racket: () => {
      const r = rk();
      return `
        <label class="fld"><span>Frame</span>
          <select id="wzRacket">${racketOptions()}</select></label>
        <dl class="wz-facts">
          <div><dt>Stock pattern</dt><dd>${r.pattern}</dd></div>
          <div><dt>Throat holes</dt><dd>${r.throatPairs} sets</dd></div>
          <div><dt>Recommended tension</dt><dd>${r.tension[0]} to ${r.tension[1]} lb</dd></div>
        </dl>
        <p class="hint">Its own pattern is used. You can try others later on the Racket tab.</p>
        <!-- A catalogue of a few dozen frames will not hold someone's actual racket, and
             the failure mode is silent: they pick something that looks close
             and trust its routing. Say what the app can and cannot tell
             them, and invent nothing about a frame that is not in here. -->
        <button type="button" class="btn ghost wz-unlisted" data-wz-unlisted
          aria-expanded="${draft.unlisted ? 'true' : 'false'}">My racket isn't listed</button>
        ${draft.unlisted ? `<p class="note wz-unlisted-note">
          Pick any frame to learn the motions. For the real string path, follow your own frame's markings.</p>` : ''}`;
    },

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
          <div><dt>Racket</dt><dd>${r.brand} ${modelName(r)}</dd></div>
          <div><dt>Pattern</dt><dd>${bed.patternLabel} <em>(stock)</em></dd></div>
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
    if (e.target.closest('[data-wz-unlisted]')) {
      draft.unlisted = !draft.unlisted;
      render();
      return;
    }
    const set = e.target.closest('[data-set]');
    if (set) {
      draft[set.dataset.set] = set.dataset.val;
      applyRecommendation();
      render();
      return;
    }
    const nav = e.target.closest('[data-wz]');
    if (!nav) return;
    /* Back on the first question returns to the start dialog */
    if (nav.dataset.wz === 'back') {
      if (!stepIx) { onCancel(); return; }
      stepIx--; render(); return;
    }
    if (stepIx < STEPS.length - 1) { stepIx++; render(); return; }
    onDone(Object.assign({}, draft));
  }

  function change(e) {
    if (e.target.id === 'wzRacket') {
      draft.racketId = e.target.value;
      applyRecommendation();
      render();
    }
  }

  function open(mount, current, done, cancel) {
    host = mount; onDone = done; onCancel = cancel; stepIx = 0;
    const r = RACKETS.find(x => x.id === current.racketId) || RACKETS[0];
    draft = {
      purpose: 'practice', racketId: r.id, unlisted: false,
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
