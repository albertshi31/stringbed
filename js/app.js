/* Wiring: state -> geometry -> the four screens.
 *
 * Everything below the presentation layer is untouched — rackets, strings,
 * geometry, racketSvg, steps, job, tension, knot, startKnot, machines, wizard
 * and throat all keep their own logic. This file only decides what is on
 * screen and hands them the numbers.
 *
 * Four screens. 1-3 are one linear job (pick a frame, pick a string, string
 * it); Learn is reference and changes nothing.
 */
(function () {
  const el = id => document.getElementById(id);
  const all = s => [...document.querySelectorAll(s)];

  const state = {
    racketId: 'ps97',
    mainId: 'syngut', crossId: 'syngut',
    mainGauge: null, crossGauge: null,
    tMain: 55, tCross: 55,
    linkCross: true, linkTension: true, crossKind: 'Synthetic gut',
    method: 'two', machineType: 'dropweight',
    kind: 'Synthetic gut',
    step: 0, stepOpen: true, startBeat: 1, stringStep: 0, card: 0,
    tab: 'racket', sub: 'words', knot: 'finish', primerDone: false, checked: {},
    seenStart: false, jobStatus: 'setup', purpose: 'practice',
    mode: 'real', pattern: 'stock', sideCard: 'racket'
  };
  const DEFAULTS = JSON.parse(JSON.stringify(state));

  /* ---------------- catalogue helpers ---------------- */

  /* Model names carry no version suffix on screen: a first-timer looking at a
     Pro Staff does not need to know it is a v14, and the suffix is the longest
     part of the label in a dropdown. */
  const VARIANT = /^(MP|Pro|Tour|ISO|XTD|LS?|P)$/i;
  function splitModel(r) {
    const name = racketName(r);
    const toks = name.split(/\s+/);
    /* The family is everything before the first size or variant token. The
       first token is always family, or "Pro Staff" would file under "Pro". */
    let i = 1;
    while (i < toks.length && !/^\d/.test(toks[i]) && !VARIANT.test(toks[i])) i++;
    return { name: name, family: toks.slice(0, i).join(' '), variant: toks.slice(i).join(' ') };
  }
  const modelName = r => splitModel(r).name;
  const BRANDS = [...new Set(RACKETS.map(r => r.brand))].sort();

  /* Families alphabetical, models within a family by head size. */
  function familiesOf(brand) {
    const fam = {};
    RACKETS.filter(r => r.brand === brand).forEach(r => {
      const f = splitModel(r).family;
      (fam[f] = fam[f] || []).push(r);
    });
    return Object.keys(fam).sort().map(f => ({
      family: f, models: fam[f].slice().sort((a, b) => a.headSize - b.headSize)
    }));
  }

  const racket = () => RACKETS.find(r => r.id === state.racketId) || RACKETS[0];
  const brandOf = () => racket().brand;
  const str = id => STRINGS.find(s => s.id === id) || STRINGS[0];
  const mainHex = () => str(state.mainId).color;
  const crossHex = () => str(state.crossId).color;

  const KINDS = ['Synthetic gut', 'Multifilament', 'Polyester', 'Natural gut'];
  const KIND_BLURB = {
    'Synthetic gut': 'Cheap, forgiving and easy to weave. The usual place to start.',
    'Multifilament': 'Soft and comfortable, closest to natural gut. Easier on the arm.',
    'Polyester': 'Stiff and controlled, the competitive default. Loses tension fastest.',
    'Natural gut': 'The most elastic and comfortable there is, and the most expensive.'
  };
  const ofKind = k => STRINGS.filter(s => s.type === k);
  /* Only the kind is chosen, so a kind is also its one catalogue entry. */
  const idOfKind = k => (ofKind(k)[0] || str('syngut')).id;

  /* What the string is, in words: the kind and its thickness when one kind
     fills the bed, both kinds when it is a hybrid. */
  const stringWords = (sM, sC, gauge) =>
    sM.id === sC.id ? `${sM.name} ${gauge.toFixed(2)} mm` : `${sM.name} / ${sC.name}`;

  /* ---------------- theme ---------------- */
  function rgb(h) {
    const v = h.replace('#', '');
    const n = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
    return [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16));
  }
  const lumOf = c => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  const hex2 = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  function readableOnDark(hex) {
    const c = rgb(hex);
    if (lumOf(c) >= 0.62) return hex;
    for (let k = 0.05; k < 1; k += 0.05) {
      const m = c.map(v => v + (255 - v) * k);
      if (lumOf(m) >= 0.62) return hex2(m);
    }
    return '#e9eef5';
  }
  /* light outline for a dark string, dark outline for a light one */
  function strEdge(hex) {
    const [r, g, b] = rgb(hex).map(v => v / 255);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 0.45 ? '#e9eef5' : '#0b0e12';
  }
  /* The chrome keeps ONE accent across every frame — this is an instrument
     panel, not a brand showcase, and letting a racket's paint drive the buttons
     is what made every screen shout at a different volume. Only the drawing
     wears the frame's own colours. */
  function applyTheme(r) {
    const t = r.theme, root = document.documentElement;
    const set = (k, v) => root.style.setProperty(k, v);
    set('--frame-a', t.frameA); set('--frame-b', t.frameB); set('--frame-edge', t.frameEdge);
    set('--str', mainHex());
    set('--str-edge', strEdge(mainHex()));
  }

  /* ---------------- core compute ---------------- */
  let cache = null;
  /* One piece is one physical string, so it cannot carry two. Two piece can, and
     that is the only place the second plane's controls appear -- a hybrid is
     not a thing you select, it is what two piece with two different strings
     already is. */
  const crossLocked = () => state.method === 'one';
  /* The crosses a hybrid had before one piece made them follow the mains, so
     going back to two piece gives them back. */
  let heldCross = null;
  const hybrid = () => state.crossId !== state.mainId;

  function normalizeState() {
    if (crossLocked()) {
      state.crossId = state.mainId;
      state.crossKind = state.kind;
    } else {
      if (KINDS.indexOf(state.crossKind) < 0) state.crossKind = str(state.crossId).type;
      if (str(state.crossId).type !== state.crossKind) state.crossId = idOfKind(state.crossKind);
    }
    state.linkCross = !hybrid();
    state.crossGauge = state.mainGauge;          // one thickness control, both planes
    if (state.linkTension) state.tCross = state.tMain;
  }

  function compute() {
    normalizeState();
    const r = racket();
    const bed = Geo.buildStringbed(r, r.pattern);
    const sM = str(state.mainId), sC = str(state.crossId);
    const gM = state.mainGauge || sM.gauge, gC = state.crossGauge || sC.gauge;
    const stats = Geo.stats(r, bed, state.tMain, state.tCross, sM, sC, gM, gC);
    cache = { r, bed, stats, sM, sC, throatPairs: r.throatPairs, gM, gC };
    return cache;
  }

  /* The plan for whatever is selected. Everything that names an end, a
     direction or a side reads this, so they cannot drift apart. */
  const planFor = c => Steps.plan(c.throatPairs, state.method, c.bed.crosses.length, c.bed.mains.length);

  function svgOpts(c, stage, animate, crop, opts) {
    const pl = planFor(c);
    return {
      racket: c.r, bed: c.bed,
      mainColor: mainHex(), crossColor: crossHex(),
      mainGauge: c.gM, crossGauge: c.gC,
      weave: true, grommets: !(opts && opts.grommets === false),
      stage: stage, animate: animate, crop: crop, throatPairs: c.throatPairs,
      pace: opts && opts.pace, clampDemo: opts && opts.clampDemo,
      startBeat: opts && opts.startBeat, markScale: opts && opts.markScale,
      labelScale: opts && opts.labelScale,
      roomW: opts && opts.roomW,
      highlightYoke: opts && opts.highlightYoke, markThroatPairs: opts && opts.markThroatPairs,
      stepIndex: opts && opts.stepIndex, tension: opts && opts.tension,
      mountRig: opts && opts.mountRig, hideLabel: opts && opts.hideLabel,
      minFont: opts && opts.minFont, hitR: opts && opts.hitR, tied: opts && opts.tied,
      crossFromTop: pl.crossFromTop, crossStartSide: pl.crossStartSide, mainsStart: pl.mainsStart,
      knots: (opts && opts.noKnots) ? [] : knotMarks(c, stage)
    };
  }

  /* Draw a racket into host, then measure how big it really is on screen.
     If its smallest label would read under 12 px there (a phone, or the
     pinned drawing), draw it once more with the type sized for that scale,
     and on a touch screen give each knot marker a fingertip-sized target.
     make(fit) returns the SVG; fit is {} the first time. Nothing to measure
     (a hidden tab, or a test in jsdom) means the first drawing stands. */
  function paintArt(host, make) {
    host.innerHTML = make({});
    const svg = host.querySelector('svg');
    const vb = svg && svg.viewBox && svg.viewBox.baseVal;
    const r = svg && svg.getBoundingClientRect();
    if (!vb || !vb.width || !r || !r.width || !r.height) return host.innerHTML;
    const s = Math.min(r.width / vb.width, r.height / vb.height);
    // roomW: how wide the svg box is in drawing units, past the racket's own width
    const fit = { minFont: 12.2 / s, hitR: touchOnly() ? 21 / s : 0, roomW: r.width / s };
    if (fit.minFont <= 8 && !fit.hitR) return host.innerHTML;
    host.innerHTML = make(fit);
    return host.innerHTML;
  }
  /* knot markers on a small drawing grow a little with the type, up to 1.6x */
  const markFor = (fit, base) => base * Math.min(1.6, Math.max(1, (fit.minFont || 0) / 12));

  /* Where the knots land, so they can be marked on the frame. */
  function knotMarks(c, stage) {
    if (stage === 'empty' || stage === 'start') return [];
    const b = c.bed, one = state.method === 'one', nC = b.crosses.length;
    const pl = planFor(c);
    const leftMain = b.mains[1], rightMain = b.mains[b.mains.length - 2];
    const mainOnSide = side => (side < 0 ? leftMain : rightMain);
    const mainY = m => (pl.mainsEnd === 'head' ? m.top : m.bottom);
    const crossAt = end => (end === 'head' ? b.crosses[0] : b.crosses[nC - 1]);
    const crossXY = (end, side) => {
      const cr = crossAt(end);
      return { x: side < 0 ? cr.left : cr.right, y: cr.y };
    };
    const k = [];
    if (one) {
      const m = mainOnSide(pl.mainsEndSide);
      k.push({ x: m.x, y: mainY(m), label: 'Mains tie-off (short side)', lesson: 'finish',
        note: `With one piece, only the short side is knotted here. The long side carries straight on into the crosses at the ${pl.crossStart}.` });
      const e = crossXY(pl.crossEnd, pl.crossEndSide);
      k.push({ x: e.x, y: e.y, label: 'Final cross knot', lesson: 'finish',
        note: `${nC} crosses is an ${nC % 2 ? 'odd' : 'even'} number, and the string changes side on every one, so it finishes on the ${pl.knotsSameSide ? 'same side as' : 'opposite side from'} the mains knot, at the ${pl.crossEnd}.` });
    } else {
      k.push({ x: leftMain.x, y: mainY(leftMain), label: 'Main tie-off', lesson: 'finish',
        note: `Both ends of the mains finish at the ${pl.mainsEnd} and get knotted at the tie-off holes the frame marks.` });
      k.push({ x: rightMain.x, y: mainY(rightMain), label: 'Main tie-off', lesson: 'finish',
        note: `Both ends of the mains finish at the ${pl.mainsEnd} and get knotted at the tie-off holes the frame marks.` });
      const st = crossXY(pl.crossStart, pl.crossStartSide);
      k.push({ x: st.x, y: st.y, label: 'Cross starting knot', lesson: 'start',
        note: `With two piece, the cross string needs its own starting knot, at the ${pl.crossStart}.` });
      const en = crossXY(pl.crossEnd, pl.crossEndSide);
      k.push({ x: en.x, y: en.y, label: 'Cross finishing knot', lesson: 'finish',
        note: `The final knot of the job, at the ${pl.crossEnd}. Four knots in total.` });
    }
    return stage === 'mains' ? k.filter(x => /^Main/.test(x.label)) : k;
  }

  /* A word the reader may not have met, with its definition one hover away. */
  const term = (key, label) =>
    `<abbr class="term" tabindex="0" data-term="${key}">${label || key}` +
    `<span class="sr-only">: ${Job.TERMS[key]}</span></abbr>`;

  /* ---------------- the job key ---------------- */
  /* The identity of the JOB — what the ticked checks belong to. */
  function configKey(s) {
    const r = RACKETS.find(x => x.id === s.racketId) || RACKETS[0];
    const gM = s.mainGauge || 0, gC = s.crossGauge || 0;
    return [r.id, r.pattern, s.method, s.mainId, s.crossId, s.tMain, s.tCross, gM, gC].join('|');
  }
  const KEY_FIELDS = ['racketId', 'method', 'mainId', 'crossId', 'tMain', 'tCross',
                      'mainGauge', 'crossGauge', 'linkCross', 'linkTension', 'kind', 'crossKind'];

  /* Changing the frame, string, tension, gauge or method starts a DIFFERENT
     job, and the checklist belongs to the old one. Propose the change, see
     whether the key moved, and put everything back if the answer is no.
     Nothing is asked when there is nothing to lose. */
  function keepChecks(before) {
    if (configKey(Object.assign({}, state, before)) === configKey(state)) return true;
    if (!Job.hasChecks(state)) return true;
    const n = Object.keys(state.checked).filter(k => state.checked[k]).length;
    if (confirm(`Changing the setup starts a different job, so your ${n} ticked ` +
                `check${n === 1 ? '' : 's'} will be cleared.\n\nChange it anyway?`)) {
      // a different job starts at its first step
      state.step = 0; state.stepOpen = true; state.startBeat = 1; state.stringStep = 0;
      stopBeats(); clearTimeout(stringTimer); stringTimer = null;
      return true;
    }
    Object.assign(state, before);
    return false;
  }
  function guardConfig(apply) {
    const before = {}; KEY_FIELDS.forEach(k => (before[k] = state[k]));
    apply();
    return keepChecks(before);
  }

  /* ---------------- the spec strip ---------------- */
  function renderSpec(c) {
    const cut = Fmt.cutFor(c.stats, state.method === 'one');
    el('specStrip').innerHTML = [
      ['Frame', modelName(c.r)],
      ['String', stringWords(c.sM, c.sC, c.gM)],
      ['Tension', state.tMain === state.tCross ? state.tMain + ' lb'
          : state.tMain + ' / ' + state.tCross + ' lb'],
      ['Cut', Fmt.metresOnly(cut)]
    ].map(([k, v]) => `<span class="spec-i"><em>${k}</em><b>${v}</b></span>`).join('');
  }

  /* ---------------- 1 · racket ---------------- */
  /* Built once, then only re-marked. Replacing a segmented control's markup on
     every render throws away the focused button mid-interaction, and any node a
     handler is still holding goes with it. */
  function fillSeg(id, items, attr) {
    const host = el(id);
    if (!host.dataset.filled) {
      host.innerHTML = items.map(it =>
        `<button type="button" role="radio" data-${attr}="${it.v}" aria-checked="false"
          ${it.off ? 'disabled' : ''}>${it.t}</button>`).join('');
      host.dataset.filled = '1';
    }
    return host;
  }

  function renderRacket(c) {
    fillSeg('brandSeg', BRANDS.map(b => ({ v: b, t: b })), 'brand');
    markSeg('brandSeg', 'brand', brandOf());

    /* The model list only changes when the brand does, and rebuilding it while
       the select has focus closes the open dropdown under the pointer. */
    if (el('selModel').dataset.brand !== brandOf()) {
      const fams = familiesOf(brandOf());
      /* Group by family only where a family actually has more than one frame.
         A list of one-frame groups is a heading above every line, which reads
         as twice the list it is -- and it prints the family name twice, once as
         the label and once inside the model it labels. */
      const opt = (r, label) =>
        `<option value="${r.id}">${label} · ${r.pattern}</option>`;
      // only a family with more than one frame gets a heading
      el('selModel').innerHTML = fams.map(g => g.models.length > 1
          ? `<optgroup label="${g.family}">` + g.models.map(r => opt(r, modelName(r))).join('') + '</optgroup>'
          : g.models.map(r => opt(r, modelName(r))).join('')).join('');
      el('selModel').dataset.brand = brandOf();
    }
    el('selModel').value = state.racketId;

    const pl = planFor(c);

    paintArt(el('racketArt'), fit => RacketSVG.render(svgOpts(c, 'empty', false, 'head',
      Object.assign({ noKnots: true }, fit))));
    // the summary strip already gives the cut length: no fact boxes here
  }

  /* ---------------- 2 · string ---------------- */
  /* The string screen is three decisions, and all three on one page meant the
     one you were making had no more weight than the others. A deck: one card at
     a time, the rail above it showing where you are AND what you have already
     chosen, so nothing is hidden, only quiet. Only the kind of string is asked,
     never a brand or model. */
  const CARDS = ['Setup', 'Kind', 'Tension'];
  const cardEls = () => all('#tab-string .card');

  const pair = (a, b) => (a === b ? a : a + ' / ' + b);
  function cardSummary(c, i) {
    if (i === 0) return `${(state.mainGauge || c.sM.gauge).toFixed(2)} mm · `
      + `${state.method === 'one' ? 'One' : 'Two'} piece`;
    if (i === 1) return pair(state.kind, state.crossKind);
    return pair(state.tMain + ' lb', state.tCross + ' lb');
  }

  function renderDeck(c) {
    el('deckNav').innerHTML = CARDS.map((t, i) =>
      `<button type="button" class="deck-tab ${i === state.card ? 'on' : ''}" role="tab"
        aria-selected="${i === state.card}" tabindex="${i === state.card ? 0 : -1}" data-card="${i}">
        <span class="deck-n">${i + 1}</span>
        <span class="deck-t"><b>${t}</b><em>${cardSummary(c, i)}</em></span>
      </button>`).join('');
    cardEls().forEach((p, i) => { p.hidden = i !== state.card; });
    el('deckPrev').disabled = state.card === 0;
    el('deckNext').textContent = state.card === CARDS.length - 1 ? 'Next: string it' : 'Next';
  }

  /* Out of range goes on to the next screen, which is what "next" means on the
     last card. */
  function goCard(i) {
    if (i >= CARDS.length) { showTab('do'); return; }
    state.card = Math.max(0, Math.min(CARDS.length - 1, i));
    renderDeck(cache || compute());
    save();
  }

  function renderString(c, animate) {
    const two = !crossLocked();
    const kindOpts = KINDS.map(k => ({ v: k, t: k, off: !ofKind(k).length }));
    fillSeg('kindSeg', kindOpts, 'kind');
    markSeg('kindSeg', 'kind', state.kind);
    fillSeg('crossKindSeg', kindOpts, 'kind');
    markSeg('crossKindSeg', 'kind', state.crossKind);

    /* The second plane's controls exist only where a second plane does. */
    ['kindMainH', 'kindCrossWrap'].forEach(id => { el(id).hidden = !two; });

    el('kindHelp').textContent = (KIND_BLURB[state.kind] || '')
      + (two && state.kind !== state.crossKind
          ? ` A hybrid: ${state.kind.toLowerCase()} mains, ${state.crossKind.toLowerCase()} crosses.` : '');


    el('tMainLab').textContent = state.linkTension ? 'Mains and crosses' : 'Mains';
    el('tMain').value = state.tMain;
    el('tCross').value = state.tCross;
    el('linkTension').checked = state.linkTension;
    el('tCrossWrap').hidden = state.linkTension;
    /* No per-frame range: makers change it between generations, and one
       general note is all a first job needs. */
    el('tenRange').textContent = '';
    el('tenRange').hidden = true;
    const odd = v => v < 48 || v > 60;
    const warn = odd(state.tMain) || odd(state.tCross);
    el('tenWarn').hidden = !warn;
    el('tenWarn').textContent = warn ? 'Most rackets are strung between 48 and 60 lb.' : '';

    if (!el('selGauge').options.length)
      el('selGauge').innerHTML = GAUGES.map(g =>
        `<option value="${g}">${g.toFixed(2)} mm</option>`).join('');
    el('selGauge').value = nearestGauge(state.mainGauge || c.sM.gauge);
    markSeg('methodSeg', 'm', state.method);
    fillSeg('machineSeg', Job.MACHINES.map(m => ({ v: m.id, t: m.name.split(' ')[0] })), 'machine');
    markSeg('machineSeg', 'machine', state.machineType);
    el('setupHelp').textContent = (state.method === 'one' && heldCross
      ? 'One piece uses one string, so the crosses now match the mains. ' : '')
      + (state.method === 'one'
      ? 'One piece uses 2 knots and one string all the way through. '
      : 'Two piece uses 4 knots, and the mains and crosses can be different kinds of string. ')
      + Job.machine(state.machineType).clamp;
    renderDeck(c);

    paintArt(el('stringArt'), fit => RacketSVG.render(svgOpts(c, 'done', animate, 'head',
      Object.assign({}, fit, { markScale: markFor(fit, 1) }))));
    /* The markers are the only thing on the page that can be touched without
       looking like a control, so the page has to say so. */
    el('stringHint').innerHTML = `<span><b>${state.method === 'one' ? 2 : 4} knots</b> marked on the frame`
      + '. ' + markerWords('string') + '</span>';


  }

  /* [label, value, note?] -> a row of small blocks. The note is the sentence the
     number needs and the headline does not. */
  function facts(id, rows) {
    el(id).innerHTML = rows.map(r =>
      `<div><dt>${r[0]}</dt><dd>${r[1]}${r[2] ? `<em>${r[2]}</em>` : ''}</dd></div>`).join('');
  }

  const markSeg = (id, attr, val) => all('#' + id + ' button').forEach(b => {
    const on = b.dataset[attr] === val;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.tabIndex = on ? 0 : -1;
  });

  /* A radio group is one tab stop; the arrow keys move within it and pick,
     the way native radio buttons do. */
  document.addEventListener('keydown', e => {
    const b = e.target.closest && e.target.closest('[role=radiogroup] > button[role=radio]');
    if (!b) return;
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    const btns = [...b.parentElement.querySelectorAll('button[role=radio]:not(:disabled)')];
    const next = btns[(btns.indexOf(b) + dir + btns.length) % btns.length];
    e.preventDefault(); e.stopPropagation();
    next.click(); next.focus();
  }, true);

  /* ---------------- 3 · string it ---------------- */
  let steps = [];

  function buildSteps(c) {
    const cfg = {
      racket: c.r, bed: c.bed, stats: c.stats, method: state.method,
      throatPairs: c.throatPairs, mainString: c.sM, crossString: c.sC,
      gMain: c.gM, gCross: c.gC, tMain: state.tMain, tCross: state.tCross,
      machineType: state.machineType
    };
    steps = Steps.build(cfg);
    if (Job.progress(steps, state).complete)
      steps = Steps.build(Object.assign({ jobComplete: true }, cfg));
    state.step = Math.min(state.step, steps.length - 1);
    return steps;
  }

  const stepDone = i => {
    const checks = steps[i].checks.filter(Boolean);
    // a step with nothing to tick is done once you have moved past it
    if (!checks.length) return i < state.step;
    return checks.every((_, k) => state.checked[i + '-' + k]);
  };

  function renderDo(c, animate) {
    const key = configKey(state);
    if (state.jobKey && state.jobKey !== key) state.checked = {};
    state.jobKey = key;
    buildSteps(c);

    stageHome();
    el('steps').innerHTML = steps.map((s, i) => {
      const open = i === state.step && state.stepOpen;
      const checks = s.checks.filter(Boolean);
      return `<li class="step ${open ? 'on' : ''} ${i === state.step ? 'current' : ''}
          ${i < state.step ? 'past' : ''} ${stepDone(i) ? 'done' : ''}" data-i="${i}">
        <button type="button" class="step-h" aria-expanded="${open}">
          <span class="step-n">${stepDone(i) ? '&#10003;' : i + 1}</span>
          <span class="step-t"><b>${s.title}</b></span>
        </button>
        <div class="step-b">
          ${s.body}
          <div class="step-checks"${checks.length ? '' : ' hidden'}>
            <h4 class="step-sh">Check before continuing</h4>
            ${checks.map((ch, k) => `<label class="check"><input type="checkbox" data-ck="${i}-${k}"
              ${state.checked[i + '-' + k] ? 'checked' : ''}><span>${ch}</span></label>`).join('')}
          </div>
          <div class="cta-row">
            ${i > 0 ? '<button type="button" class="btn ghost" data-step-prev>Back</button>' : ''}
            ${i === steps.length - 1
              ? '<button type="button" class="btn primary" data-finish>Finish</button>'
                + (Job.progress(steps, state).complete
                  ? '<button type="button" class="btn ghost" data-new-job>String another racket</button>' : '')
              : '<button type="button" class="btn primary" data-step-next>Done → next step</button>'}
          </div>
        </div>
      </li>`;
    }).join('');

    el('primer').hidden = !!state.primerDone;
    // past the first step the reminder shrinks to one slim line
    el('primer').classList.toggle('slim', state.step > 0);
    // the walk-through cards are tapped on a phone, not clicked
    if (touchOnly()) all('#steps .beat-hint').forEach(p => p.childNodes.forEach(n => {
      if (n.nodeType === 3 && /click a card/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace('click a card', 'tap a card');
    }));
    syncProgress();
    placeStage();
    el('jobNotice').textContent = Job.purpose(state.purpose).notice || '';
    renderStage(c);
  }

  /* Where you are, and how much of it you have confirmed. Both, because the two
     answer different questions: the step says what to do next, the count says
     whether the job behind you is actually finished. */
  function syncProgress() {
    const jp = Job.progress(steps, state);
    el('stepRail').innerHTML = steps.map((s, i) => {
      const cls = [i === state.step ? 'current' : '', i < state.step ? 'past' : '',
                   stepDone(i) ? 'done' : ''].join(' ');
      return `<li><button type="button" class="rail-b ${cls}" data-rail="${i}"
        title="${i + 1}. ${s.title.replace(/"/g, '&quot;')}"
        aria-label="Step ${i + 1}: ${s.title.replace(/"/g, '&quot;')}${stepDone(i) ? ' (done)' : ''}"
        ${i === state.step ? 'aria-current="step"' : ''}>
        <span class="rail-n">${stepDone(i) ? '&#10003;' : i + 1}</span><span class="rail-bar"></span>
      </button></li>`;
    }).join('');
    el('progText').textContent = `Step ${jp.stepNo} of ${jp.stepCount} · `
      + (jp.complete ? '\u2713 All checks complete' : `${jp.done} of ${jp.total} checks`);
    syncFinishMsg();
  }

  /* The drawing beside the current step. */
  function renderStage(c) {
    const st = steps[state.step];
    if (!st) return;
    const viewFor = fit => {
      const R = (stage, anim, extra) =>
        RacketSVG.render(svgOpts(c, stage, anim, 'head', Object.assign({}, fit, extra)));
      if (st.id === 'throat')
        return R('empty', false, { highlightYoke: true, markThroatPairs: c.throatPairs, noKnots: true });
      if (st.id === 'mount') return R('empty', false, { mountRig: true, noKnots: true });
      if (st.id === 'start') return R('start', false, { startBeat: state.startBeat || 1 });
      if (st.id === 'mains' || st.id === 'crosses') {
        const mains = st.id === 'mains';
        const n = mains ? c.bed.mains.length : c.bed.crosses.length, k = state.stringStep;
        const tie = mains ? k === n - 1 : k === n + 1;
        const ms = markFor(fit, 1.4);
        return R(st.id, !k, k
          ? { stepIndex: tie ? n : (mains ? k + 2 : k), markScale: ms, noKnots: !tie, tied: tie,
              tension: mains ? state.tMain : state.tCross }
          : { pace: mains ? 0.62 : 0.58, clampDemo: true, markScale: ms });
      }
      if (st.id === 'measure' || st.id === 'tools') return R('empty', false, { noKnots: true });
      return R('done', false, { markScale: markFor(fit, 1.4) });
    };
    // which drawing is up, so the stylesheet can size each one for a phone
    const stageBox = stageEl();
    if (stageBox) stageBox.dataset.view = st.id;
    const view = paintArt(el('doArt'), viewFor);
    // the knot markers are easy to miss, so say they can be opened
    const hasKnots = /class="knot"/.test(view);
    /* the string-by-string frames number their three actions on the racket
       (racketSvg.js stepped view): 1 pull it through / weave it, 2 tension
       it, 3 clamp it. Say so, or the numbers read as an order of strings. */
    const hasBadges = /class="hint-dot"/.test(view);
    const chip = n => `<b class="chip">${n}</b>`;
    const key = !hasBadges ? '' : st.id === 'crosses'
      ? `${chip(1)} weave it through · ${chip(2)} tension it · ${chip(3)} clamp it`
      : `${chip(1)} pull it through · ${chip(2)} tension it · ${chip(3)} clamp it`;
    const knotLine = !hasKnots ? '' : markerWords('do');
    /* An animated run draws its knots last, so the line about them waits
       until they are there to tap; until then it would point at nothing. */
    const late = /class="knots" style="--d:([\d.]+)s;opacity:0"/.exec(view);
    const knotSpan = late
      ? `<span class="hint-late" style="animation-delay:${late[1]}s">${knotLine}</span>` : `<span>${knotLine}</span>`;
    el('doHint').hidden = !(key || knotLine);
    el('doHint').innerHTML = [key && '<span>' + key + '</span>', knotLine && knotSpan].filter(Boolean).join('<br>');
    // the walk-through card for the moment on screen is the selected one
    all('#steps .cycle-card[data-beat]').forEach(b => {
      const on = st.id === 'start' && +b.dataset.beat === (state.startBeat || 1);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    el('doCapN').textContent = `Step ${state.step + 1} of ${steps.length}`;
    el('doCapT').textContent = st.title;
    const stringing = st.id === 'mains' || st.id === 'crosses';
    el('stepCtl').hidden = !stringing;
    if (stringing) syncPlayer(c, st);
  }

  /* The scrubber under the drawing. stringStep 0 is the animated run of the
     whole step; 1..last are still frames, one string at a time, and the last
     frame is the tie-off. */
  function stringFrames(c, st) {
    return st.id === 'crosses' ? c.bed.crosses.length + 1 : c.bed.mains.length - 1;
  }
  function stringLabel(c, st, k) {
    if (!k) return 'Whole step';
    if (st.id === 'crosses') {
      const n = c.bed.crosses.length;
      return k > n ? 'Crosses tied off' : `Cross ${k} of ${n}`;
    }
    const n = c.bed.mains.length;
    return k >= n - 1 ? 'Mains tied off' : `Main ${Math.min(n, k + 2)} of ${n}`;
  }
  function syncPlayer(c, st) {
    const last = stringFrames(c, st), k = state.stringStep || 0;
    const scrub = el('stringScrub');
    scrub.max = String(last);
    /* the animated whole step sits at the start of the track: a thumb at the
       far right read as "finished" before anything had been strung */
    scrub.value = String(k || 1);
    scrub.style.setProperty('--fill', ((k || 1) - 1) / Math.max(1, last - 1) * 100 + '%');
    el('stringLabel').textContent = stringLabel(c, st, k);
    el('btnPrevString').disabled = k === 1;
    el('btnNextString').disabled = k === last;
    const playing = !!stringTimer;
    const play = el('btnPlayString');
    play.innerHTML = playing
      ? '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.2v11.6c0 .6.7 1 1.2.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8C4.7 1.2 4 1.6 4 2.2z" fill="currentColor"/></svg>';
    play.setAttribute('aria-label', playing ? 'Pause' : 'Play string by string');
    play.classList.toggle('playing', playing);
  }

  /* play string by string on a timer, so the scrubber moves with it */
  let stringTimer = null;
  function stopStrings() {
    if (!stringTimer) return;
    clearTimeout(stringTimer); stringTimer = null;
    if (cache && steps[state.step]) renderStage(cache);
  }
  function playStrings() {
    const st = steps[state.step], last = stringFrames(cache, st);
    if (!state.stringStep || state.stringStep >= last) state.stringStep = 1;
    const tick = () => {
      if (state.stringStep >= stringFrames(cache, steps[state.step])) {
        stringTimer = null; renderStage(cache); return;
      }
      state.stringStep += 1;
      stringTimer = setTimeout(tick, reduceMotion() ? 900 : 650);
      renderStage(cache);
    };
    stringTimer = setTimeout(tick, reduceMotion() ? 900 : 650);
    renderStage(cache);
  }

  /* ---------------- 4 · learn ---------------- */
  /* The glossary in groups, so a term is found by what it is about rather
     than hunted for in one long list. Every term in Job.TERMS belongs to
     exactly one group. */
  const GLOSS_GROUPS = [
    ['The racket', ['mains', 'crosses', 'head', 'throat', 'grommet', 'tie-off']],
    ['Setting up a job', ['one piece', 'two piece', 'gauge', 'M/C', 'split tension', 'hybrid',
                          'stiffness', 'pre-stretch']],
    ['String types', ['polyester', 'multifilament', 'synthetic gut', 'natural gut']],
    ['How a stringbed plays', ['power', 'control', 'spin', 'comfort', 'feel', 'durability',
                               'snapback', 'notching', 'tension loss']],
    ['Machines and clamps', ['dropweight', 'crank', 'electronic', 'lockout', 'fixed clamps',
                             'flying clamps']]
  ];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /* The moment to clamp, drawn for each machine: the dropweight's bar level,
     the crank locking out, the electronic head holding a steady reading. */
  const CLAMP_ART = (() => {
    const A = '#4cc9e0', G = '#79cfa4', M = '#8f9aa7', F = '#3a4049', E = '#05070a', W = '#e6ebf2';
    const svg = b => `<svg viewBox="0 0 120 90" class="mc-svg">${b}</svg>`;
    return {
      dropweight: svg(`
        <rect x="6" y="30" width="22" height="46" rx="3" fill="${F}"/>
        <path d="M17,48 L112,48" stroke="${G}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <path d="M17,48 L104,26" stroke="${M}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
        <path d="M17,48 L104,48" stroke="${W}" stroke-width="4" stroke-linecap="round"/>
        <rect x="74" y="38" width="16" height="20" rx="2" fill="${M}" stroke="${E}" stroke-width="1.2"/>
        <circle cx="17" cy="48" r="4" fill="${W}" stroke="${E}" stroke-width="1.2"/>
        <path d="M100,30 q6,8 0,14" fill="none" stroke="${A}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M97,41 l3,3 l3,-4" fill="none" stroke="${A}" stroke-width="1.6" stroke-linecap="round"/>
        <text x="60" y="72" text-anchor="middle" class="mc-l" fill="${G}">level</text>`),
      crank: svg(`
        <rect x="6" y="28" width="30" height="44" rx="3" fill="${F}"/>
        <circle cx="72" cy="50" r="22" fill="none" stroke="${M}" stroke-width="3"/>
        <path d="M72,50 L88,32" stroke="${W}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="88" cy="32" r="4.5" fill="${W}" stroke="${E}" stroke-width="1.2"/>
        <circle cx="72" cy="50" r="3.5" fill="${W}"/>
        <path d="M50,44 a22,22 0 0 1 12,-15" fill="none" stroke="${A}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M58,26 l5,2 l-2,5" fill="none" stroke="${A}" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="98" y="16" width="14" height="11" rx="2" fill="${G}"/>
        <path d="M101,16 v-3 a4,4 0 0 1 8,0 v3" fill="none" stroke="${G}" stroke-width="1.8"/>
        <path d="M94,34 l-4,3 M98,37 l-1,5 M102,34 l3,4" stroke="${A}" stroke-width="1.4" stroke-linecap="round"/>
        <text x="72" y="86" text-anchor="middle" class="mc-l" fill="${G}">locks</text>`),
      electronic: svg(`
        <rect x="8" y="8" width="104" height="30" rx="4" fill="${F}"/>
        <text x="60" y="29" text-anchor="middle" class="mc-num" fill="${G}">55.0 lb</text>
        <path d="M12,80 L12,50 M12,80 L112,80" stroke="${M}" stroke-width="1"/>
        <path d="M14,78 C28,78 30,54 44,54 L108,54" fill="none" stroke="${A}" stroke-width="2.2"/>
        <circle cx="84" cy="54" r="4" fill="${G}" stroke="${E}" stroke-width="1"/>
        <text x="84" y="70" text-anchor="middle" class="mc-l" fill="${G}">steady</text>`)
    };
  })();

  function renderLearn() {
    /* each term folds shut, so the list reads as an index you open into */
    const term = (k, def) => `<details class="gl"><summary><span class="gl-caret" aria-hidden="true"></span>${cap(k)}</summary><p>${def}</p></details>`;
    const def = k => Job.TERMS[k] || Job.MACHINE_TERMS[k];
    el('glossary').innerHTML = GLOSS_GROUPS.map(([title, keys]) =>
      `<section class="gl-group"><h3>${title}</h3>${keys.filter(def).map(k => term(k, def(k))).join('')}</section>`
    ).join('');
    /* one switch above the groups opens or closes every term at once */
    let tog = el('glossToggle');
    if (!tog) {
      tog = document.createElement('button');
      tog.type = 'button'; tog.id = 'glossToggle'; tog.className = 'btn tiny ghost gloss-toggle';
      el('glossary').parentNode.insertBefore(tog, el('glossary'));
      tog.addEventListener('click', () => {
        const open = !all('#glossary details.gl').every(d => d.open);
        all('#glossary details.gl').forEach(d => { d.open = open; });
        syncGlossToggle();
      });
      el('glossary').addEventListener('toggle', syncGlossToggle, true);
    }
    syncGlossToggle();
    /* one row per machine, from the same data the Machines tab reads, so the
       two tabs cannot disagree about when to clamp */
    el('ttMachines').innerHTML = Job.MACHINES.map(m =>
      `<li class="mc"><div class="mc-art" aria-hidden="true">${CLAMP_ART[m.id] || ''}</div>
        <div class="mc-t"><span class="mc-k">${m.name}</span><b>${m.clamp}</b></div></li>`).join('');
  }

  function syncGlossToggle() {
    const tog = el('glossToggle');
    if (!tog) return;
    const allOpen = all('#glossary details.gl').every(d => d.open);
    tog.textContent = allOpen ? 'Collapse all' : 'Expand all';
    tog.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
  }

  let knotLesson = 'finish';
  function selectKnot(which) {
    knotLesson = which === 'start' ? 'start' : 'finish';
    if (state.knot !== knotLesson) { state.knot = knotLesson; save(); }
    ['finish', 'start'].forEach(k => {
      const tab = el('ktab-' + k), panel = el('kpanel-' + k);
      if (!tab || !panel) return;
      const on = k === knotLesson;
      tab.classList.toggle('on', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });
    const na = el('knotStartNA');
    if (na) na.hidden = state.method !== 'one';
  }

  const KNOT_BG = '#0c0e12';
  function dist(x, y) { const A = rgb(x), B = rgb(y); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); }
  function contrastWith(tail) {
    const options = ['#8d96a3', '#e6e9ee', '#4a525e', '#57b1c8'];
    return options.reduce((best, c) => (dist(c, tail) > dist(best, tail) ? c : best), options[0]);
  }
  function mountKnots() {
    const tail = mainHex();
    const col = { bg: KNOT_BG, tail: tail, anchor: contrastWith(tail), accent: '#4cc9e0' };
    Knot.mount(el('knotMount'), col);
    StartKnot.mount(el('startKnotMount'), col);
    selectKnot(state.knot);
  }

  /* ---------------- render ---------------- */
  /* All three job screens are redrawn together, not just the visible one. They
     are three views of ONE job: the checklist's progress line, the spec strip
     and the drawing all have to agree the moment anything changes, and a screen
     that is only rebuilt when you navigate to it is a screen that can be found
     showing the previous job. */
  function render(animate) {
    const c = compute();
    applyTheme(c.r);
    renderSpec(c);
    renderRacket(c);
    renderString(c, animate && state.tab === 'string');
    renderDo(c, animate && state.tab === 'do');
    save();
  }

  const nearestGauge = g => GAUGES.reduce((a, b) => Math.abs(b - g) < Math.abs(a - g) ? b : a);
  /* A phone that reports a mouse-like pointer still gets tapped, so a touch
     seen once settles it for the rest of the visit. */
  let sawTouch = false;
  const touchOnly = () => {
    if (sawTouch) return true;
    try {
      return window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
    } catch (e) { return false; }
  };
  /* What a knot marker does, in the words for the pointer in hand. Every hint
     about the markers is built from here, so no render path can miss it. */
  const MARKER_WORDS = {
    string: ['Tap a marker to see which knot it is.',
             'Hover over a marker to see what it is, or click it for the knot diagram.'],
    do: ['Tap a marker to see which knot goes there.',
         'Hover over a marker to see which knot goes there. Click it to learn the knot.']
  };
  const markerWords = k => MARKER_WORDS[k][touchOnly() ? 0 : 1];
  /* the first touch rewrites any mouse wording already on screen */
  function noteTouch() {
    if (sawTouch) return;
    sawTouch = true;
    ['stringHint', 'doHint'].forEach(id => {
      const h = el(id); if (!h) return;
      const walk = document.createTreeWalker(h, 4);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        Object.keys(MARKER_WORDS).forEach(k => {
          if (n.nodeValue.indexOf(MARKER_WORDS[k][1]) >= 0)
            n.nodeValue = n.nodeValue.replace(MARKER_WORDS[k][1], MARKER_WORDS[k][0]);
        });
      }
    });
    all('#steps .beat-hint').forEach(p => p.childNodes.forEach(n => {
      if (n.nodeType === 3 && /click a card/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace('click a card', 'tap a card');
    }));
  }
  document.addEventListener('touchstart', noteTouch, { passive: true, capture: true });
  document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') noteTouch(); }, true);
  const reduceMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  };

  /* ---------------- navigation ---------------- */
  let backTab = 'do';
  function showBack(on) {
    const b = el('backToStep');
    b.hidden = !on;
    if (!on) return;
    backTab = state.tab === 'learn' ? backTab : state.tab;
    b.textContent = backTab === 'do' ? `\u2190 Back to step ${state.step + 1}`
      : `\u2190 Back to ${{ racket: 'Racket', string: 'String' }[backTab] || 'where you were'}`;
  }
  function showTab(name, keepScroll) {
    if (['racket', 'string', 'do', 'learn'].indexOf(name) < 0) name = 'racket';
    if (name !== 'learn') el('backToStep').hidden = true;
    state.tab = name;
    hideTip();
    clearTimeout(stringTimer); stringTimer = null;
    all('.tab').forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    all('.screen').forEach(p => p.classList.toggle('on', p.id === 'tab-' + name));
    render(name === 'string');
    if (keepScroll) return;
    /* String it opens on the open step, its header at the top under the
       pinned chrome. The one exception is a first visit, still on step 1 with
       the first-time card showing: that card is meant to be read first. */
    if (name === 'do' && !(state.step === 0 && !state.primerDone)) { revealStep(true, true); return; }
    try { window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); } catch (e) { /* no viewport */ }
  }

  /* A link into Learn lands on the part it names, not the top of the tab. */
  function revealIn(target) {
    const t = typeof target === 'string' ? el(target) : target;
    if (!t) return;
    const r = t.getBoundingClientRect();
    if (!r.height) return;
    const head = document.querySelector('.top');
    const headH = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().height : 0;
    try {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - headH - 12), behavior: 'auto' });
    } catch (e) { /* no viewport */ }
  }
  function openLearn(sub, target) {
    showTab('learn', true); showSub(sub);
    if (sub === 'knots') selectKnot(knotLesson);
    revealIn(target || 'sub-' + sub);
  }

  function showSub(name) {
    if (['words', 'tension', 'knots', 'machines'].indexOf(name) < 0) name = 'words';
    state.sub = name;
    all('.subtab').forEach(t => {
      const on = t.dataset.sub === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    all('#tab-learn .sub').forEach(p => { p.hidden = p.id !== 'sub-' + name; });
    // on a phone the sub-tabs are one sideways-scrolling row: keep this one in it
    const on = document.querySelector('.subtab.on'), row = el('subtabs');
    if (on && row && row.scrollWidth > row.clientWidth) {
      const x = on.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
      try { row.scrollTo({ left: x - (row.clientWidth - on.offsetWidth) / 2, behavior: 'auto' }); }
      catch (e) { /* old browsers */ }
    }
    save();
  }

  /* ---------------- export ---------------- */
  let msgTimer = null;
  function toolMsg(text, bad) {
    const m = el('exportMsg');
    if (!m) return;
    m.textContent = text;
    m.classList.toggle('bad', !!bad);
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { m.textContent = ''; m.classList.remove('bad'); }, 6000);
  }
  function download(name, blob) {
    if (!blob) throw new Error('no data');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const fileBase = () => (cache.r.brand + '-' + modelName(cache.r) + '-' + cache.bed.patternLabel
      + '-' + stringWords(cache.sM, cache.sC, cache.gM) + '-' + state.tMain + (state.tCross !== state.tMain ? '-' + state.tCross : '') + 'lb')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const exportSvg = () => RacketSVG.render(svgOpts(cache, 'done', false, 'full'));
  function saveSvg() {
    try {
      download(fileBase() + '.svg', new Blob([exportSvg()], { type: 'image/svg+xml' }));
      toolMsg('SVG downloaded.');
    } catch (e) { toolMsg('Could not generate the SVG.', true); }
  }
  function savePng() {
    let url = null;
    try {
      const holder = document.createElement('div');
      holder.innerHTML = exportSvg();
      const svg = holder.querySelector('svg');
      const vb = svg.viewBox.baseVal, scale = 3;
      const img = new Image();
      url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = vb.width * scale; cv.height = vb.height * scale;
          const ctx = cv.getContext('2d');
          ctx.fillStyle = '#0b0d10';
          ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(b => {
            try { download(fileBase() + '.png', b); toolMsg('PNG downloaded.'); }
            catch (e) { toolMsg('Could not generate the PNG.', true); }
          });
        } catch (e) { toolMsg('Could not generate the PNG.', true); }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { toolMsg('Could not generate the PNG.', true); URL.revokeObjectURL(url); };
      img.src = url;
    } catch (e) {
      if (url) URL.revokeObjectURL(url);
      toolMsg('Could not generate the PNG.', true);
    }
  }

  /* ---------------- tooltip ---------------- */
  let hideTip = () => {};
  function knotSheet(g) {
    let host = el('knotSheet');
    if (!host) {
      host = document.createElement('div');
      host.className = 'modal'; host.id = 'knotSheet';
      document.body.appendChild(host);
      host.addEventListener('click', e => {
        if (e.target.closest('.modal-back, .modal-x')) host.classList.remove('on');
      });
    }
    const lesson = g.dataset.lesson === 'start' ? 'start' : 'finish';
    host.innerHTML = `<div class="modal-back"></div>
      <div class="modal-card ks-card" role="dialog" aria-modal="true" aria-label="${g.dataset.label}">
        <button class="modal-x" aria-label="Close">&times;</button>
        <p class="ks-kind">${lesson === 'start' ? 'Starting knot' : 'Finishing tie-off'}</p>
        <h2 class="ks-h">${g.dataset.label}</h2>
        ${g.dataset.note ? `<p class="ks-note">${g.dataset.note}</p>` : ''}
        <button type="button" class="btn primary ks-go" data-goto="knot" data-knot="${lesson}">See how to tie it</button>
      </div>`;
    host.classList.add('on');
  }
  function initTooltip() {
    const tip = document.createElement('div');
    tip.className = 'tip'; tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    let on = null;
    const move = (x, y) => {
      const r = tip.getBoundingClientRect(), W = window.innerWidth, M = 8;
      let left = x + 14, top = y - r.height - 12;
      if (left + r.width > W - M) left = x - r.width - 14;
      // on a narrow screen neither side may fit, so keep it inside the screen
      left = Math.max(M, Math.min(left, W - r.width - M));
      if (top < M) top = y + 18;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    };
    hideTip = () => { on = null; tip.classList.remove('on'); };
    // the tip is fixed to the screen, so it would float off its word on scroll
    window.addEventListener('scroll', () => { if (on) hideTip(); }, { passive: true });
    const fill = g => {
      if (g.dataset.term) {
        const lab = g.cloneNode(true);
        lab.querySelectorAll('.sr-only').forEach(x => x.remove());
        tip.innerHTML = `<b>${lab.textContent.trim()}</b>`
          + `<span>${Job.TERMS[g.dataset.term] || Job.MACHINE_TERMS[g.dataset.term] || ''}</span>`;
        return;
      }
      tip.innerHTML = `<b>${g.dataset.label}</b>${g.dataset.note ? '<span>' + g.dataset.note + '</span>' : ''}`
        + (g.classList.contains('knot')
          ? `<em>${touchOnly() ? 'Tap again' : 'Click'} to see how to tie this knot</em>` : '');
    };
    const show = (g, x, y) => { fill(g); tip.classList.add('on'); move(x, y); };
    const pick = e => (e.target.closest ? e.target.closest('.knot, .hint-dot, .term') : null);
    document.addEventListener('focusin', e => {
      const g = pick(e); if (!g) { tip.classList.remove('on'); return; }
      const r = g.getBoundingClientRect(); on = g; show(g, r.left + r.width / 2, r.top);
    });
    document.addEventListener('pointermove', e => {
      const g = pick(e);
      if (g) { if (g !== on) { on = g; show(g, e.clientX, e.clientY); } else move(e.clientX, e.clientY); }
      else if (on) { on = null; tip.classList.remove('on'); }
    });
    /* A marker is a small target on a phone and some sit close together, so a
       tap anywhere on the racket takes the nearest marker within reach. */
    const near = e => {
      const svg = e.target.closest ? e.target.closest('.racket-svg') : null;
      if (!svg) return null;
      let best = null, bd = 40;
      svg.querySelectorAll('.knot, .hint-dot').forEach(k => {
        const r = k.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
        if (d < bd) { bd = d; best = k; }
      });
      return best;
    };
    document.addEventListener('click', e => {
      /* on a touch screen the targets are fingertip-sized and can overlap, so
         the marker whose centre is nearest the tap wins, not the one on top */
      const g = touchOnly() && near(e) || pick(e) || near(e);
      if (!g) { if (on) { on = null; tip.classList.remove('on'); } return; }
      /* On a phone a hover tooltip is no use and the markers are small, so a
         tap opens a card that names the knot, with a button to its lesson. */
      if (touchOnly() && g.classList.contains('knot')) {
        on = null; tip.classList.remove('on');
        knotSheet(g);
        return;
      }
      if (g === on && g.classList.contains('knot')) {
        /* The marker says which knot it is. Every tie-off is the finishing
           knot; only the one that starts a two-piece cross bunch is the other
           lesson, and landing on the wrong one is worse than not linking. */
        knotLesson = g.dataset.lesson === 'start' ? 'start' : 'finish';
        showBack(true);
        openLearn('knots', 'kpanel-' + knotLesson);
        return;
      }
      const r = g.getBoundingClientRect(); on = g; show(g, r.left + r.width / 2, r.top);
    });
  }

  /* ---------------- start card + wizard ---------------- */
  let startOpener = null;
  function trapTab(card) {
    return e => {
      if (e.key !== 'Tab') return;
      const f = [...card.querySelectorAll('button, select, input, [tabindex]:not([tabindex="-1"])')]
        .filter(x => !x.disabled && !x.hidden && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
  }
  function showStart(showResume) {
    const host = el('startCard'), card = host.querySelector('.modal-card');
    startOpener = document.activeElement;
    el('startChoose').hidden = false;
    el('wizard').hidden = true;
    const p = Job.progress(steps.length ? steps : buildSteps(cache || compute()), state);
    const resume = !!showResume && Job.hasProgress(state);
    el('startResume').hidden = !resume;
    if (resume) el('startResumeText').textContent =
      `Last viewed: step ${p.stepNo} of ${p.stepCount} · ${p.done} of ${p.total} checks complete.`;
    host.classList.add('on');
    if (!host._trapped) { host.addEventListener('keydown', trapTab(card)); host._trapped = true; }
    if (card.focus) card.focus();
  }
  function hideStart() {
    state.seenStart = true;
    save();
    el('startCard').classList.remove('on');
    if (startOpener && startOpener.focus) startOpener.focus();
    startOpener = null;
  }
  function openWizard() {
    el('startCard').classList.add('on');
    el('startChoose').hidden = true;
    el('wizard').hidden = false;
    startOpener = startOpener || document.activeElement;
    Wizard.open(el('wizard'), state, applyWizard, hideStart);
  }
  function applyWizard(d) {
    /* The guide only asks before throwing away work: a job with ticked checks. */
    if (Job.hasChecks(state) && !confirm('Start a new job? Your ticked checks will be cleared.')) return;
    state.purpose = Job.purpose(d.purpose).id;
    heldCross = null;
    state.racketId = d.racketId;
    state.machineType = d.machineType;
    state.method = d.method;
    state.kind = state.crossKind = KINDS.indexOf(d.kind) < 0 ? 'Synthetic gut' : d.kind;
    state.mainId = state.crossId = idOfKind(state.kind);
    state.mainGauge = state.crossGauge = d.gauge;
    state.tMain = d.tMain; state.tCross = d.tCross;
    state.linkCross = true; state.linkTension = false;
    state.step = 0; state.stepOpen = true; state.checked = {}; state.jobStatus = 'active';
    hideStart();
    mountKnots();
    showTab('do');
  }

  /* ---------------- events ---------------- */
  /* Bring the open step under the chrome.
   *
   * Two gestures, two answers. Pressing Back or Next moves you to a step you
   * may not be able to see, and the button you pressed is not the thing that
   * moved -- so it always scrolls. Clicking a header moves the very thing you
   * are pointing at, so it scrolls only when the body it just opened would not
   * fit on screen, and then by the least it can.
   *
   * No layout (a test in jsdom) means nothing to measure and nothing to do. */
  function revealStep(always, instant) {
    const li = document.querySelector('#steps .step.on');
    if (!li) return;
    const r = li.getBoundingClientRect();
    if (!r.height) return;
    const head = document.querySelector('.top');
    /* the step rail is pinned under the header on wide screens, so it covers
       the top of the page too */
    const rail = document.querySelector('#tab-do .prog');
    const pinned = rail && getComputedStyle(rail).position === 'sticky'
      ? rail.getBoundingClientRect().height : 0;
    // a header that scrolls away (a phone) takes no room at the top
    const headH = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().height : 0;
    const chrome = headH + pinned + 12;
    if (!always && r.top >= chrome && r.bottom <= window.innerHeight) return;
    try {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - chrome),
                        behavior: instant || reduceMotion() ? 'auto' : 'smooth' });
    } catch (e) { /* no viewport */ }
  }

  /* On a phone the steps and the drawing are one column, and the drawing sat
     above all nine steps, out of sight of the one being read. There it moves
     into the open step, under its title; on a wide screen it stays beside. */
  const narrow = () => { try { return window.matchMedia('(max-width: 900px)').matches; } catch (e) { return false; } };
  const stageEl = () => el('tab-do').querySelector('.stage');
  function stageHome() {
    const st = stageEl(), home = el('tab-do').querySelector('.layout-do');
    if (st && st.parentElement !== home) home.appendChild(st);
  }
  function placeStage() {
    const st = stageEl(), body = document.querySelector('#steps .step.on > .step-b');
    /* On a phone, the steps whose drawing is only the empty racket skip it:
       it took half the screen and showed nothing to do. */
    const cur = steps[state.step];
    st.hidden = !!(narrow() && cur && (cur.id === 'tools' || cur.id === 'measure'));
    /* with every step closed there is nothing to draw beside, and the phone
       layout would lift the drawing above the heading */
    if (narrow() && !body) st.hidden = true;
    if (narrow() && body) {
      body.insertBefore(st, body.firstChild);
      const head = document.querySelector('.top');
      // the header scrolls away on a phone, so the drawing pins to the very top
      const pinned = head && getComputedStyle(head).position === 'sticky';
      document.documentElement.style.setProperty('--hdr', (pinned ? head.getBoundingClientRect().height : 0) + 'px');
    } else stageHome();
  }
  try { window.matchMedia('(max-width: 900px)').addEventListener('change', placeStage); } catch (e) { /* old browsers */ }

  /* Finish either confirms the job or says what is still open, and takes you
     there. It used to try to go to a step after the last one, which did nothing. */
  function finishJob() {
    const open = firstOpenStep();
    if (open < 0) { render(false); confetti(); return; }
    el('finishMsg').dataset.on = '1';
    if (open !== state.step || !state.stepOpen) {
      state.step = open; state.stepOpen = true; state.startBeat = 1; state.stringStep = 0;
      stopBeats(); clearTimeout(stringTimer); stringTimer = null;
      render(false);
    } else syncFinishMsg();
    /* Say it where the eye is: the reminder sits in the open step, right
       above its checks, and the boxes still to tick flash an outline. */
    const li = document.querySelector('#steps .step.on');
    if (!li) return;
    li.querySelectorAll('.check').forEach(lab => {
      const box = lab.querySelector('input[data-ck]');
      lab.classList.remove('nudge');
      if (box && !box.checked) { void lab.offsetWidth; lab.classList.add('nudge'); }
    });
    const checks = li.querySelector('.step-checks');
    const r = checks && checks.getBoundingClientRect();
    if (!r || !r.height) return;
    const head = document.querySelector('.top');
    const headH = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().height : 0;
    const rail = document.querySelector('#tab-do .prog');
    const railH = rail && getComputedStyle(rail).position === 'sticky' ? rail.getBoundingClientRect().height : 0;
    const pin = li.querySelector('.step-b > .stage');
    const pinH = pin && !pin.hidden && getComputedStyle(pin).position === 'sticky' ? pin.getBoundingClientRect().height : 0;
    const top = headH + railH + pinH + 16;
    // the checks and the buttons under them, as much as fits under the chrome
    const want = r.top - top - Math.max(0, (window.innerHeight - top - r.height - 90) / 2);
    try {
      window.scrollTo({ top: Math.max(0, window.scrollY + want), behavior: reduceMotion() ? 'auto' : 'smooth' });
    } catch (e) { /* no viewport */ }
  }

  /* A little celebration for a finished racket: confetti falling down the
     screen for a few seconds. Skipped when the device asks for less motion. */
  function confetti() {
    if (reduceMotion()) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    if (!ctx) { cv.remove(); return; }
    const cols = ['#4cc9e0', '#9fdcea', '#79cfa4', '#e8b268', '#e6ebf2', '#f28fad'];
    const bits = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.6,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
      vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 3,
      r: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4,
      c: cols[Math.floor(Math.random() * cols.length)]
    }));
    const t0 = performance.now();
    const frame = t => {
      ctx.clearRect(0, 0, W, H);
      bits.forEach(b => {
        b.vy += 0.05; b.x += b.vx + Math.sin((t + b.r * 500) / 400); b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r)));
        ctx.restore();
      });
      if (t - t0 < 4200) requestAnimationFrame(frame); else cv.remove();
    };
    requestAnimationFrame(frame);
  }

  const firstOpenStep = () =>
    steps.findIndex((s, i) => !stepDone(i) && s.checks.filter(Boolean).length);
  /* The message is worked out from the checks every time they change, so it
     can never say a step is open after its boxes have been ticked. */
  function syncFinishMsg() {
    const msg = el('finishMsg');
    const open = msg.dataset.on ? firstOpenStep() : -1;
    all('#steps .step-warn').forEach(x => x.remove());
    msg.classList.remove('moved');
    if (open < 0) { msg.textContent = ''; delete msg.dataset.on; return; }
    msg.textContent = `Step ${open + 1} still has checks to tick.`;
    /* When that step is the open one, the same words go inside it, above its
       checks, and the line at the foot of the list stands down. */
    const box = document.querySelector(`#steps .step.on[data-i="${open}"] .step-checks`);
    if (!box) return;
    const p = document.createElement('p');
    p.className = 'step-warn';
    p.textContent = msg.textContent;
    box.insertBefore(p, box.querySelector('.check'));
    msg.classList.add('moved');
  }

  let navAt = 0;
  function goStep(to) {
    const t = Date.now();
    if (t - navAt < 400) return;
    navAt = t;
    const i = Math.max(0, Math.min(steps.length - 1, to));
    if (i === state.step) return;
    state.step = i; state.stepOpen = true; state.startBeat = 1; state.stringStep = 0;
    stopBeats(); clearTimeout(stringTimer); stringTimer = null;
    render(false); revealStep(true);
  }

  function bind() {
    el('primerDone').addEventListener('click', () => {
      state.primerDone = true; el('primer').hidden = true; save();
    });
    el('backToStep').addEventListener('click', () => {
      showTab(backTab);
    });
    el('tabs').addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b) return;
      showTab(b.dataset.tab);
      if (e.detail > 0) b.blur();   // a pointer click, not the keyboard
    });
    el('tabs').addEventListener('keydown', e => {
      const tabs = all('.tab'), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (go === undefined) return;
      e.preventDefault();
      const t = tabs[(go + tabs.length) % tabs.length];
      showTab(t.dataset.tab); t.focus();
    });
    el('subtabs').addEventListener('click', e => {
      const b = e.target.closest('.subtab'); if (b) showSub(b.dataset.sub);
    });
    el('subtabs').addEventListener('keydown', e => {
      const tabs = all('.subtab'), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (go === undefined) return;
      e.preventDefault();
      const t = tabs[(go + tabs.length) % tabs.length];
      showSub(t.dataset.sub); t.focus();
    });

    document.addEventListener('click', e => {
      if (!e.target.closest) return;
      const g = e.target.closest('[data-goto]');
      if (g) {
        /* The steps own their own jump links, and they still name the OLD
           destinations — 'tension', 'knot'. Those are Learn sub-tabs now, so
           they are translated here rather than edited out of steps.js. */
        const to = g.dataset.goto;
        // a link inside a pop-up leaves the pop-up behind
        if (g.closest('.modal')) all('.modal.on').forEach(m => m.classList.remove('on'));
        if (to === 'throat') { openThroat(); return; }
        if (to === 'grommets') { Holes.open('grommets'); return; }
        if (to === 'starthole') { Holes.open('start'); return; }
        if (to === 'weavequiz') { WeaveQuiz.open(); return; }
        // leaving the guide for a lesson: offer the way back to the same step
        if (state.tab !== 'learn' && (to === 'tension' || to === 'knot' || to === 'words')) showBack(true);
        if (to === 'words') { openLearn('words', 'tab-learn'); return; }
        if (to === 'tension') { openLearn('tension'); return; }
        if (to === 'knot') {
          if (g.dataset.knot) knotLesson = g.dataset.knot;
          openLearn('knots', 'kpanel-' + (knotLesson === 'start' ? 'start' : 'finish')); return;
        }
        showTab(to); return;
      }
      const x = e.target.closest('[data-export]');
      if (x) (x.dataset.export === 'svg' ? saveSvg : savePng)();
    });

    // the setup guide opens straight away; there is no menu in front of it
    el('btnSetup').addEventListener('click', () => { startOpener = document.activeElement; openWizard(); });

    /* ---- 1 · racket ---- */
    el('brandSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-brand]'); if (!b) return;
      const first = familiesOf(b.dataset.brand)[0].models[0];
      if (!guardConfig(() => { state.racketId = first.id; })) { render(false); return; }
      render(false); mountKnots();
    });
    el('selModel').addEventListener('change', e => {
      if (!guardConfig(() => { state.racketId = e.target.value; })) { render(false); return; }
      render(false); mountKnots();
    });

    /* ---- 2 · string ---- */
    /* On one piece the kind card has a single control, so choosing carries you
       on; on two piece the crosses are the last choice on that card, so it is
       the cross kind that does. */
    el('kindSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-kind]'); if (!b || b.disabled) return;
      if (!guardConfig(() => {
        /* The crosses come along unless a hybrid was chosen on purpose. Leaving
           them behind turned one tap on the mains into a hybrid nobody asked for. */
        const wasSame = state.crossKind === state.kind;
        state.kind = b.dataset.kind;
        state.mainId = idOfKind(state.kind);
        if (crossLocked() || wasSame) { state.crossKind = state.kind; state.crossId = state.mainId; }
      })) { render(false); return; }
      render(false); mountKnots();
      if (crossLocked()) goCard(2);
    });
    el('crossKindSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-kind]'); if (!b || b.disabled) return;
      if (!guardConfig(() => {
        state.crossKind = b.dataset.kind;
        state.crossId = idOfKind(state.crossKind);
      })) { render(false); return; }
      render(false); mountKnots();
      goCard(2);
    });

    let tenBefore = null;
    const tenStart = () => { if (!tenBefore) tenBefore = { tMain: state.tMain, tCross: state.tCross }; };
    const tenCommit = () => {
      const before = tenBefore; tenBefore = null;
      if (before) keepChecks(before);
      render(false);
    };
    /* Typed, not dragged. A half-typed number ("5" on the way to "55") is left
       alone until it is a real tension; Enter or leaving the box settles it,
       pulled into 35 to 70 lb if it is outside. */
    // a typed tension survives a reload even if the box is never left
    let saveTimer = null;
    const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); };
    const typed = v => { const n = Number(v); return v !== '' && n >= 35 && n <= 70 ? Math.round(n) : null; };
    el('tMain').addEventListener('input', e => {
      const v = typed(e.target.value); if (v === null) return;
      tenStart(); state.tMain = v;
      if (state.linkTension) state.tCross = v;
      saveSoon();
    });
    el('tCross').addEventListener('input', e => {
      const v = typed(e.target.value); if (v === null) return;
      tenStart(); state.tCross = v;
      saveSoon();
    });
    ['tMain', 'tCross'].forEach(id => el(id).addEventListener('change', e => {
      const v = clampTen(e.target.value, state[id]);
      tenStart(); state[id] = v; e.target.value = v;
      if (id === 'tMain' && state.linkTension) state.tCross = v;
      tenCommit();
    }));
    el('linkTension').addEventListener('change', e => {
      state.linkTension = e.target.checked;
      if (state.linkTension) state.tCross = state.tMain;
      render(false);
    });

    el('selGauge').addEventListener('change', e => {
      if (!guardConfig(() => {
        state.mainGauge = +e.target.value; state.crossGauge = state.mainGauge;
      })) { render(false); return; }
      render(false);
    });
    el('methodSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b || b.disabled) return;
      const from = state.method, to = b.dataset.m;
      const held = { kind: state.crossKind, id: state.crossId };
      if (!guardConfig(() => {
        state.method = to;
        if (to === 'one') {                   // one string, so the crosses follow
          state.crossKind = state.kind;
          state.crossId = state.mainId;
        } else if (from === 'one' && heldCross) {
          // back to two piece: the crosses the reader had chosen come back
          state.crossKind = heldCross.kind;
          state.crossId = heldCross.id;
        }
      })) { render(false); return; }
      if (to === 'one' && from === 'two') heldCross = held.id !== state.mainId ? held : null;
      else if (to === 'two') heldCross = null;
      render(false); selectKnot(knotLesson);
    });
    el('machineSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-machine]'); if (!b) return;
      state.machineType = b.dataset.machine;
      render(false);
    });

    el('deckNav').addEventListener('click', e => {
      const b = e.target.closest('[data-card]'); if (b) goCard(+b.dataset.card);
    });
    el('deckNav').addEventListener('keydown', e => {
      const tabs = all('#deckNav .deck-tab'), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (go === undefined) return;
      e.preventDefault();
      goCard(Math.max(0, Math.min(tabs.length - 1, go)));
      all('#deckNav .deck-tab')[state.card].focus();
    });
    el('deckPrev').addEventListener('click', () => goCard(state.card - 1));
    el('deckNext').addEventListener('click', () => goCard(state.card + 1));

    el('btnReplay').addEventListener('click', () => render(true));

    /* ---- 3 · string it ---- */
    el('steps').addEventListener('click', e => {
      const beat = e.target.closest('[data-beat]');
      if (beat) {
        if (beat.dataset.beat === 'play') playBeats();
        else { stopBeats(); state.startBeat = +beat.dataset.beat; renderStage(cache); }
        return;
      }
      if (e.target.closest('[data-step-next]')) { goStep(state.step + 1); return; }
      if (e.target.closest('[data-finish]')) { finishJob(); return; }
      if (e.target.closest('[data-new-job]')) { openWizard(); return; }
      if (e.target.closest('[data-step-prev]')) { goStep(state.step - 1); return; }
      const m = e.target.closest('[data-method]');
      if (m) {
        if (!guardConfig(() => {
          if (m.dataset.method === 'one') state.crossId = state.mainId;
          state.method = m.dataset.method;
        })) { render(false); return; }
        render(false); return;
      }
      const h = e.target.closest('.step-h');
      if (h) {
        const i = +h.parentElement.dataset.i;
        stopBeats(); clearTimeout(stringTimer); stringTimer = null;
        state.stepOpen = (i === state.step) ? !state.stepOpen : true;
        state.step = i; state.startBeat = 1; state.stringStep = 0;
        render(false);
        if (state.stepOpen) revealStep(false);
      }
    });
    el('steps').addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const h = e.target.closest('.step-h');
      if (h) { e.preventDefault(); h.click(); }
    });
    el('steps').addEventListener('change', e => {
      const ck = e.target.dataset.ck; if (!ck) return;
      const was = Job.progress(steps, state).complete;
      if (e.target.checked) state.checked[ck] = true; else delete state.checked[ck];
      save();
      syncProgress();
      const li = e.target.closest('.step');
      if (li) li.classList.toggle('done', stepDone(+li.dataset.i));
      if (Job.progress(steps, state).complete !== was) render(false);
    });

    const lastString = () => stringFrames(cache, steps[state.step]);
    const halt = () => { clearTimeout(stringTimer); stringTimer = null; };
    el('btnNextString').addEventListener('click', () => {
      halt(); state.stringStep = Math.min(lastString(), (state.stringStep || 0) + 1); renderStage(cache);
    });
    el('btnPrevString').addEventListener('click', () => {
      halt();
      const k = state.stringStep || lastString() + 1;
      state.stringStep = Math.max(1, k - 1); renderStage(cache);
    });
    el('btnPlayString').addEventListener('click', () => {
      if (stringTimer) stopStrings(); else playStrings();
    });
    el('stringScrub').addEventListener('input', e => {
      halt(); state.stringStep = +e.target.value; renderStage(cache);
    });
    el('btnReplayStep').addEventListener('click', () => { halt(); state.stringStep = 0; renderStage(cache); });

    el('stepRail').addEventListener('click', e => {
      const b = e.target.closest('[data-rail]'); if (!b) return;
      navAt = 0; goStep(+b.dataset.rail);
    });

    /* Arrow keys walk the steps while the bench is showing -- unless focus is
       in something that uses the arrows itself. */
    document.addEventListener('keydown', e => {
      if (state.tab !== 'do' || e.altKey || e.ctrlKey || e.metaKey) return;
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.repeat) return;
      const a = document.activeElement;
      if (a && (/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) || a.closest('[role=tablist]'))) return;
      if (document.querySelector('.modal.on') || (el('wizard') && !el('wizard').hidden)) return;
      e.preventDefault();
      navAt = 0; goStep(state.step + (e.key === 'ArrowRight' ? 1 : -1));
    });

    /* ---- 4 · learn ---- */
    el('knotPicker').addEventListener('click', e => {
      const b = e.target.closest('[data-knot]'); if (b) { selectKnot(b.dataset.knot); b.focus(); }
    });
    el('knotPicker').addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
      e.preventDefault();
      const next = (e.key === 'ArrowRight' || e.key === 'End') ? 'start' : 'finish';
      selectKnot(next); el('ktab-' + next).focus();
    });

    /* ---- start card ---- */
    el('startCard').addEventListener('click', e => {
      const b = e.target.closest('[data-start]'); if (!b) return;
      const a = b.dataset.start;
      if (a === 'wizard') openWizard();
      else if (a === 'direct' || a === 'resume' || a === 'dismiss') hideStart();
      else if (a === 'fresh') {
        /* Nothing is cleared yet: backing out of the wizard keeps the job.
           applyWizard clears the checklist when the new job is confirmed. */
        openWizard();
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el('startCard').classList.contains('on')) hideStart();
    });
  }

  /* Any number is pulled into 35 to 70 lb, 0 included. Only a box with no
     number in it falls back. */
  const clampTen = (v, fallback) => {
    const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
    return Number.isFinite(n) ? Math.max(35, Math.min(70, Math.round(n))) : (fallback || 52);
  };

  function openThroat() {
    Throat.open({
      racket: cache.r, bed: cache.bed, throatPairs: cache.throatPairs, method: state.method,
      headSvg: RacketSVG.render(Object.assign(svgOpts(cache, 'empty', false, 'head'),
        { highlightYoke: true, markThroatPairs: cache.throatPairs, hideLabel: true, knots: [] })),
      depthSvg: RacketSVG.render(Object.assign(svgOpts(cache, 'empty', false, 'head'),
        { hideLabel: true, grommets: false, knots: [] })),
      yokeSvg: RacketSVG.render(Object.assign(svgOpts(cache, 'empty', false, 'yoke'),
        { highlightYoke: true, markThroatPairs: cache.throatPairs, knots: [] }))
    });
    /* the close-up's labels are sized for the screen it opened on, as the
       bench drawings are; it is a picture only, so it stays out of the tab order */
    const yoke = document.querySelector('#throatModal .th-yoke');
    if (yoke) paintArt(yoke, fit => RacketSVG.render(Object.assign(svgOpts(cache, 'empty', false, 'yoke'),
      { highlightYoke: true, markThroatPairs: cache.throatPairs, knots: [], minFont: fit.minFont }))
      .replace(/tabindex="0"/g, 'tabindex="-1"')
      .replace(/<svg /g, '<svg aria-hidden="true" focusable="false" '));
  }

  /* step through the six start beats on a timer */
  let beatTimer = null;
  function stopBeats() { clearTimeout(beatTimer); beatTimer = null; }
  /* While it plays, the card for the moment on screen stays in view, just
     under the drawing that is pinned above the cards on a phone. */
  function keepCardInView() {
    const card = document.querySelector('#steps .step.on .cycle-card.on');
    const r = card && card.getBoundingClientRect();
    if (!r || !r.height) return;
    const pin = document.querySelector('#steps .step.on .step-b > .stage');
    const top = (pin && getComputedStyle(pin).position === 'sticky'
      ? Math.max(0, pin.getBoundingClientRect().bottom) : 0) + 8;
    const dy = r.top < top ? r.top - top : r.bottom > window.innerHeight - 8 ? r.bottom - window.innerHeight + 8 : 0;
    if (!dy) return;
    try { window.scrollBy({ top: dy, behavior: reduceMotion() ? 'auto' : 'smooth' }); } catch (e) { /* no viewport */ }
  }
  function playBeats() {
    stopBeats();
    state.startBeat = 1; renderStage(cache); keepCardInView();
    const tick = () => {
      if (state.startBeat >= 6) { beatTimer = null; return; }
      state.startBeat += 1; renderStage(cache); keepCardInView();
      beatTimer = setTimeout(tick, 1400);
    };
    beatTimer = setTimeout(tick, 1400);
  }

  /* ---------------- persistence ---------------- */
  function save() { Job.save(state); }
  function restore() {
    const o = Job.load(DEFAULTS, { rackets: RACKETS, strings: STRINGS, patterns: PATTERNS, gauges: GAUGES });
    Object.keys(o).forEach(k => (state[k] = o[k]));
    /* The saved KIND is what counts. Older saves named a particular string
       ('alu', 'nxt' and so on) that is no longer in the catalogue, so the
       string is always worked out again from the kind, and a missing kind
       means synthetic gut. */
    if (KINDS.indexOf(state.kind) < 0) state.kind = 'Synthetic gut';
    if (KINDS.indexOf(state.crossKind) < 0) state.crossKind = state.kind;
    state.mainId = idOfKind(state.kind);
    state.crossId = idOfKind(state.crossKind);
  }

  /* ---------------- boot ---------------- */
  RACKETS.forEach(r => { r.theme.accent2 = readableOnDark(r.theme.accent2); });
  restore();
  bind();
  initTooltip();
  renderLearn();
  el('machineMount').innerHTML = MachineGuide.html();
  mountKnots();
  showSub(state.sub);
  showTab(state.tab);
  /* No pop-up on arrival: the numbered tabs show where to start, and the
     setup guide is one click away in the header. */
})();
