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
    string:  'Which string?',
    review:  'Check it over'
  };

  const rk = () => RACKETS.find(r => r.id === draft.racketId);
  const sg = () => STRINGS.find(s => s.id === draft.mainId);
  const mid = r => Math.round((r.tension[0] + r.tension[1]) / 2);
  /* the same name the bench uses: no version suffix */
  const modelName = r => r.model.replace(/\s+v\d+$/i, '');
  const label = r => `${modelName(r)} · ${r.pattern} · ${r.headSize} in²`;

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
          <div><dt>Head size</dt><dd>${r.headSize} in²</dd></div>
          <div><dt>Throat holes</dt><dd>${r.throatPairs} sets</dd></div>
          <div><dt>Recommended tension</dt><dd>${r.tension[0]} to ${r.tension[1]} lb</dd></div>
        </dl>
        <p class="hint">Its own pattern is used. You can try others later in the simulator.</p>
        <!-- A catalogue of a few dozen frames will not hold someone's actual racket, and
             the failure mode is silent: they pick something that looks close
             and trust its routing. Say what the simulator can and cannot tell
             them, and invent nothing about a frame that is not in here. -->
        <button type="button" class="btn ghost wz-unlisted" data-wz-unlisted
          aria-expanded="${draft.unlisted ? 'true' : 'false'}">My racket isn't listed</button>
        ${draft.unlisted ? `<p class="note wz-unlisted-note">
          Pick any frame to learn the motions. For the real string path, follow your own frame's markings.</p>` : ''}`;
    },

    machine: () => paneChoice('machineType', Job.MACHINES.map(m =>
      ({ v: m.id, t: m.name, d: m.clamp }))),

    string: () => {
      const r = rk();
      const pick = draft.stringMode === 'recommend';
      const syn = STRINGS.find(s => s.type === 'Synthetic gut');
      return paneChoice('stringMode', [
        { v: 'recommend', t: 'Recommend a practice string',
          d: `${syn.name} at ${syn.gauge.toFixed(2)} mm, ${mid(r)} lb, the middle of this frame’s range.` },
        { v: 'known', t: 'I know my string', d: 'Pick it yourself on the bench afterwards.' }
      ]) + (pick ? `<p class="hint">Cheap and easy to weave, so good for learning.</p>` : '');
    },

    review: () => {
      const r = rk(), s = sg();
      const bed = Geo.buildStringbed(r, r.pattern);
      const st = Geo.stats(r, bed, draft.tMain, draft.tCross, s, s, draft.gauge, draft.gauge);
      /* Only a RECOMMENDED string is applied on Start -- "I know my string"
         deliberately leaves the bench alone. So the review may not name one:
         it used to print the recommendation either way, which meant the
         summary you were asked to check over listed a string the app was
         about to not set. Say what will actually happen instead. */
      const picked = draft.stringMode === 'recommend';
      const strung = plane => picked
        ? `${s.name} · ${draft.gauge.toFixed(2)} mm · ${plane} lb`
        : '<em>you choose it on the bench after this</em>';
      return `
        <dl class="wz-facts wz-review">
          <div><dt>Racket</dt><dd>${r.brand} ${modelName(r)}</dd></div>
          <div><dt>Pattern</dt><dd>${bed.patternLabel} <em>(stock)</em></dd></div>
          <div><dt>Machine</dt><dd>${Job.machine(draft.machineType).name}</dd></div>
          <div><dt>Mains</dt><dd>${strung(draft.tMain)}</dd></div>
          <div><dt>Crosses</dt><dd>${strung(draft.tCross)}</dd></div>
          <div><dt>Method</dt><dd>${draft.method === 'one' ? 'One piece · 2 knots' : 'Two piece · 4 knots'}</dd></div>
          <div><dt>String needed</dt><dd>${Fmt.metres(st.totalM)} · cut ${Fmt.metres(Fmt.cutTotal(st.totalM, draft.method === 'one'))}</dd></div>
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
        <button type="button" class="btn ghost" data-wz="back">Back</button>
        <button type="button" class="btn primary" data-wz="next">${last ? 'Start stringing' : 'Next'}</button>
      </div>`;
    /* on the review the next move is Start, so focus goes there */
    const first = last ? host.querySelector('[data-wz=next]')
      : host.querySelector('.wz-choice, select, button');
    if (first) first.focus();
  }

  /* the recommendation is recomputed from whatever racket is selected, so
     going back and changing the frame moves the tension with it */
  function applyRecommendation() {
    if (draft.stringMode !== 'recommend') return;
    const r = rk(), syn = STRINGS.find(s => s.type === 'Synthetic gut');
    draft.mainId = draft.crossId = syn.id;
    draft.gauge = syn.gauge;
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
      stringMode: Job.purpose('practice').stringMode, method: 'two',
      mainId: current.mainId, crossId: current.crossId,
      gauge: current.mainGauge || STRINGS.find(s => s.id === current.mainId).gauge,
      tMain: current.tMain, tCross: current.tCross
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
