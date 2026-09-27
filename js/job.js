/* The JOB: what is being strung, on what, how far through it is — and the
 * saved copy of all that.
 *
 * The bench already had a configuration (frame, strings, tensions, method).
 * A job is that configuration plus the things a person actually needs when
 * they come back tomorrow: which step they were on, which checks they ticked,
 * which machine is in front of them, and whether they are working on a real
 * racket or just poking at the simulator. Those belong together, because
 * losing half of them is what makes a returning user land on step 7 with an
 * empty checklist.
 */
const Job = (function () {

  const STORE = 'stringbed.v2';
  const LEGACY = 'stringbed.v1';
  const VERSION = 2;

  /* ---------------- machines ---------------- */
  /* ONE SOURCE OF TRUTH for every machine fact in the app. The setup guide, the
     job panel, the tension trainer and the Machines tab all read this, because
     they used to each carry their own copy and had drifted into contradicting
     one another -- the trainer said a dropweight holds at exactly the set
     tension while the guide said to watch the bar.
   *
   * "Accuracy" is not one number, and collapsing it into one is what produces
   * folklore in both directions. FIVE separate things, and the machines do not
   * rank the same way on all of them:
   *
   *   reference   what the number is based on, and whether that thing drifts
   *   pull        does it keep pulling, or stop once it reaches the number?
   *   repeat      string to string, does it land in the same place?
   *   operator    how much does technique and timing change the result?
   *   speed       how long a racket takes.
   *
   * The dropweight is the case that matters. Its REFERENCE is the best of the
   * three -- a mass on a lever arm, with no spring and no load cell to go out
   * of true -- which is why it is so often called the most accurate machine
   * you can buy cheaply. Its REPEATABILITY is the worst of the three, because
   * that reference is only delivered while the bar hangs level, and getting it
   * there is done by eye on every single string. Both are true, and quoting
   * only the first is how a beginner ends up being sold a dropweight on
   * "accuracy" and then wondering why their beds come out inconsistent.
   *
   * None of them is "perfect", and every machine wants a calibrator. */
  const MACHINES = [
    { id: 'dropweight', name: 'Dropweight', short: 'dropweight',
      reference: 'A mass on a lever arm, accurate when the bar sits level or very close to it',
      pull: 'Constant pull (gravity)', beat: 'Level and settle',
      repeat: 'High if your technique is consistent, since you judge level by eye on every string',
      operator: 'Most technique-dependent', speed: 'Slow',
      clamp: 'Clamp when the bar is level and settled.',
      why: 'Take up the slack, lift the bar 30 to 45° above level, and let go. Gravity lowers it and the ratchet holds what it gains. When the bar comes to rest level with the racket, the string is at the set tension, so clamp. Level matters because the pull follows the cosine of the bar angle. A bar sitting 20° off level is pulling about 6% under, which is three pounds at 52. If it settles below level, lift it above level and let go again. If it settles above level, release it and pull again. Never force the bar to horizontal by hand, because that can over-tension the string.' },
    { id: 'crank', name: 'Crank / lockout', short: 'crank',
      reference: 'A spring that trips at the set tension, so it needs calibrating',
      pull: 'Locks out and stops pulling', beat: 'Clamp promptly',
      repeat: 'Good, with consistent timing',
      operator: 'Moderately technique-dependent', speed: 'Fast',
      clamp: 'Clamp promptly after lockout.',
      why: 'A lockout head stops pulling the moment it trips. The string starts to relax right away, and any tension it loses before you clamp is gone for good. Being fast is not the point. What matters is a rhythm you repeat on every string, so each one is clamped at the same moment. Expect a slightly softer stringbed than the same number gives on a constant-pull machine.' },
    { id: 'electronic', name: 'Electronic constant-pull', short: 'electronic',
      reference: 'A load cell (a force sensor), accurate when calibrated, and it needs calibrating',
      pull: 'Constant pull', beat: 'Wait for a stable reading',
      repeat: 'Easiest to repeat racket to racket, when calibrated',
      operator: 'Least technique-dependent', speed: 'Fastest',
      clamp: 'Let the reading settle, then clamp while it is holding.',
      why: 'A constant-pull head keeps pulling as the string slowly stretches, so clamp timing matters much less than on a lockout. It still matters a little, though. Wait for the reading to stop moving, then clamp after the same pause every time. Consistent technique is still what makes it repeatable.' }
  ];

  const machine = id => MACHINES.find(m => m.id === id) || MACHINES[0];

  /* The one paragraph that stops the table above being read as a single ranking.
     It is collapsed on the page -- the cards have to be scannable first.
     Carefully NOT a claim that a dropweight is imprecise: a good dropweight
     operator is very consistent. What differs is how much of the judgement the
     machine takes off you. */
  const MACHINE_NOTE = 'A calibrated electronic constant-pull machine gets closest to the tension you set, '
    + 'and it is the easiest to repeat. A dropweight is just as accurate when you let the bar settle level '
    + 'every time. A crank is very repeatable, but it stops pulling at lockout, so the stringbed comes out a '
    + 'little softer than the number. Whichever you buy, good fixed clamps matter more than a fancier tension head.';

  /* ---------------- modes ---------------- */
  const MODES = {
    real: {
      id: 'real', name: 'String a real racket',
      blurb: 'Locked to the frame’s own pattern.',
      notice: 'Confirm tie-off holes, skipped holes and string routing against the frame or the maker’s instructions. Positions in the diagrams are only a guide.'
    },
    sandbox: {
      id: 'sandbox', name: 'Explore the simulator',
      blurb: 'Try patterns the frame is not drilled for.',
      notice: 'Sandbox patterns only change the drawing. They may not match the holes drilled in the real racket.'
    }
  };

  /* ---------------- what the job is for ---------------- */
  /* What the job is for. The wizard no longer asks: every new job is
     'practice'. It stays so saved jobs still load, and `stringMode` still
     picks the wizard's string default. */
  const PURPOSES = [
    { id: 'practice', name: 'Practicing on an old racket',
      blurb: 'Nothing is lost if it goes wrong, so it is the best way to learn.',
      stringMode: 'recommend', notice: '' },
    { id: 'play', name: 'Preparing a playable racket',
      blurb: 'Take the extra care, and check the frame’s own markings.',
      stringMode: 'known', notice: '' }
  ];
  const purpose = id => PURPOSES.find(p => p.id === id) || PURPOSES[0];

  /* ---------------- curated examples ---------------- */
  /* Four setups that each show ONE idea, built only from frames and strings
     already in the catalogue. `short` is a single line because it is read in a
     dropdown -- anything longer turns the menu into something you scroll.
     They are illustrations of a trade-off, not recommendations: what suits a
     given player is not something this app can know. */
  const EXAMPLES = [
    { id: 'practice', name: 'Beginner practice',
      short: 'Cheap and forgiving, for learning',
      set: { racketId: 'clash100', mainId: 'syngut', crossId: 'syngut', mainGauge: 1.30, crossGauge: 1.30,
             tMain: 55, tCross: 55, method: 'two', linkCross: true } },
    { id: 'comfort', name: 'Comfort',
      short: 'Soft multi, low in the range',
      set: { racketId: 'ezone98', mainId: 'nxt', crossId: 'nxt', mainGauge: 1.30, crossGauge: 1.30,
             tMain: 48, tCross: 46, method: 'two', linkCross: true } },
    { id: 'control', name: 'Control',
      short: 'Dense 18x20, stiff poly, high tension',
      set: { racketId: 'blade98', mainId: 'alu', crossId: 'alu', mainGauge: 1.25, crossGauge: 1.25,
             tMain: 58, tCross: 56, method: 'two', linkCross: true } },
    { id: 'durability', name: 'Durability',
      short: 'Hybrid with shaped poly mains',
      set: { racketId: 'purestrike', mainId: 'tourbite', crossId: 'syngut', mainGauge: 1.25, crossGauge: 1.30,
             tMain: 52, tCross: 54, method: 'two', linkCross: false } }
  ];

  /* ---------------- glossary ---------------- */
  /* Attached next to the first place each word is used rather than parked in a
     page nobody opens. The one-line entries stay one line; the string types get
     a few sentences each, because "what is a multifilament" is the question a
     beginner actually has and a six-word answer does not settle it.
     Every comparative claim in here is checked against the stiffness index the
     strings are scored on, so the glossary cannot drift away from the feel
     estimate the bench prints. */
  const TERMS = {
    mains:   'The strings that run up and down the racket, along its length.',
    crosses: 'The strings that run side to side, woven through the mains.',
    gauge:   'The thickness of the string, usually measured in millimetres. Thinner strings generally provide more feel, bite on the ball, and spin potential, but break more easily. Thicker strings are more durable and usually feel slightly firmer and more controlled.',
    throat:  'The bottom of the hoop, where the frame narrows into the handle.',
    head:    'The top of the hoop, furthest from the handle.',
    grommet: 'The plastic sleeve in each hole that the string passes through, so it does not chafe on the frame.',
    'tie-off': 'The hole where a run of string is knotted off. Frames mark these holes, and they are usually a little larger than the rest.',
    hybrid:  'Two different strings in one racket, one in the mains and another in the crosses. It has to be strung two-piece, with two separate lengths of string.',
    /* Words the interface uses without explaining them. Each is one line,
       shown only when asked for, so the bench stays as quiet as it was. */
    'M/C': 'Mains / crosses, always in that order. In a string pattern, 16x19 means 16 mains and 19 crosses, and 18x20 means 18 mains and 20 crosses. In a tension, 55/53 lb means the mains at 55 lb and the crosses at 53 lb.',
    stiffness: 'A rough number for how firm the strings feel. Higher means firmer. It is an estimate, not a measurement.',
    'split tension': 'The mains and crosses do not have to be strung at the same tension. Some players lower the cross tension slightly to soften the stringbed or allow the mains to move more freely, while others use the same tension for both. In hybrid setups, the tensions may also be adjusted to account for differences in stiffness and elasticity between the two strings.',
    /* Poly is a LOW-power string; that is the whole point of it. What it gives
       you is the freedom to swing hard without the ball leaving the court,
       which is where the pace comes from. Saying it is powerful on its own
       would send a beginner to the one string that will not help them. */
    polyester: 'The most common string type in competitive tennis. Stiff and relatively low-powered, which lets players swing aggressively while keeping the ball under control. Its ability to slide and snap back also gives it excellent spin potential. Resistant to breaking, but it loses tension and playability faster than most other string types and can be demanding on the arm.',
    multifilament: 'Made from many fine fibres bonded together to mimic some of the feel and elasticity of natural gut. Soft, comfortable, and relatively powerful, with good tension maintenance. Easier on the arm than polyester, but generally less durable and more prone to fraying.',
    /* Third of the four on stiffness, above natural gut and the multis, so the
       comparisons here run in that order -- softer than a poly, firmer than a
       multi or gut. Reversing them would contradict the bench's feel estimate. */
    'synthetic gut': 'An affordable, all-around nylon string and a common starting point for recreational players. Offers a balanced mix of comfort, power, feel, and durability. Softer and more arm-friendly than polyester, but typically firmer and less comfortable than multifilament or natural gut.',
    /* how a strung bed behaves once it is being hit */
    power: 'How much energy the stringbed gives back to the ball. Lower tension, softer strings and thinner gauges all add power. Higher tension and stiff strings take some away.',
    control: 'How predictable the ball feels coming off the strings. A firmer bed, from higher tension or a stiffer string, usually sends the ball where you aim more consistently.',
    spin: 'How easily the strings help you put topspin or slice on the ball. Open patterns like 16x19, slick strings and snapback all help. Denser patterns like 18x20 give a little less.',
    comfort: 'How soft or harsh the hit feels on your arm. Softer strings and lower tension are gentler. Stiff polyester at high tension is the harshest.',
    feel: 'The feedback you get through the racket when you hit, so you can sense where and how cleanly you struck the ball. Thinner strings and natural gut usually give the most.',
    durability: 'How long the strings keep playing well before they break or go dead. Thicker gauges and polyester last longest. Thin multifilament and natural gut wear out fastest.',
    'tension loss': 'Strings lose tension from the moment they are strung. Losing about 10 to 15 percent in the first day is normal, and it keeps dropping more slowly after that. Polyester loses tension fastest and then plays dead, which is a good reason to restring it.',
    snapback: 'When the ball lands, the mains slide sideways across the crosses and then spring back into place. That snap adds spin. Slick, stiff strings such as polyester slide and return most freely, which is a big part of why they are the spin choice.',
    notching: 'The grooves strings wear into each other where the mains and crosses rub. Notches catch the mains, so snapback and spin drop off. A deep notch is also where the string will eventually break, so it is a sign the bed is near the end of its life.',
    /* how a job is set up and strung */
    'one piece': 'The whole racket strung with one length of string, mains and crosses together. It needs only two knots.',
    'two piece': 'The mains and crosses strung with two separate lengths of string. It needs four knots, and it is the only way to string a hybrid.',
    lockout: 'The point where a crank machine reaches the set tension, trips, and stops pulling.',
    'fixed clamps': 'Clamps mounted on the machine that hold each string against the machine itself. They slip less and lose less tension than flying clamps.',
    'flying clamps': 'Loose clamps that grip a string against the string next to it. They are cheap and work, but they can slip and lose a little tension.',
    'pre-stretch': 'Pulling a string past its tension before stringing, or letting the machine do it, so it settles in faster and loses less tension later.',
    'natural gut': 'Made from natural fibres taken from cow intestine. Extremely elastic, comfortable, and powerful, with excellent feel and the best tension maintenance of the major string types. It is also the most expensive and generally less resistant to moisture and abrasion than synthetic strings.'
  };

  /* Machine definitions, one sentence each. */
  const MACHINE_TERMS = {
    dropweight: 'A weighted bar on a lever pulls the string. It is at the set tension when the bar sits level.',
    crank: 'You turn a crank until it locks out at the set tension, then it stops pulling.',
    electronic: 'A motor pulls to the set tension and keeps pulling to hold it until you clamp.'
  };

  /* Has this browser ever saved a job? Used to decide whether a first-timer
     hint is worth showing -- never to change a configuration that already
     exists, which is the one thing a returning user must not have happen. */
  function hadSaved() {
    try { return !!(localStorage.getItem(STORE) || localStorage.getItem(LEGACY)); }
    catch (e) { return true; }          // if we cannot tell, assume not new
  }

  /* ---------------- progress ---------------- */
  function progress(steps, state) {
    const total = steps.reduce((n, s) => n + s.checks.filter(Boolean).length, 0);
    let done = 0;
    steps.forEach((s, i) => s.checks.filter(Boolean).forEach((_, k) => {
      if (state.checked[i + '-' + k]) done++;
    }));
    return {
      stepNo: Math.min(state.step + 1, steps.length), stepCount: steps.length,
      done: done, total: total,
      complete: total > 0 && done === total
    };
  }

  /* Has the user actually done anything worth protecting? Used to decide
     whether a destructive action needs confirming -- asking about nothing is
     just a dialog in the way. */
  const hasProgress = state =>
    state.step > 0 || Object.keys(state.checked || {}).some(k => state.checked[k]);

  /* Ticked checks are the only thing here a person cannot get back by clicking
     once. Where you had the guide open is not work, so guarding it behind a
     confirmation asks about nothing -- and asking about nothing teaches people
     to dismiss the dialog that does matter. */
  const hasChecks = state =>
    Object.keys(state.checked || {}).some(k => state.checked[k]);

  /* ---------------- persistence ---------------- */
  /* Versioned, and every field is checked on the way back in. A saved value
     that no longer makes sense -- a racket that left the catalogue, a pattern
     that was removed, a hand-edited number -- is dropped, never trusted, and
     never allowed to stop the page loading. */
  const SAVED = ['v', 'tab', 'sub', 'knot', 'card', 'sideCard', 'seenStart', 'mode', 'machineType', 'jobStatus',
                 'purpose', 'kind', 'crossKind',
                 'racketId', 'pattern', 'mainId', 'crossId', 'mainColorIx', 'crossColorIx',
                 'mainGauge', 'crossGauge', 'tMain', 'tCross', 'linkCross', 'linkTension', 'method',
                 'step', 'stepOpen', 'checked'];

  function save(state) {
    try {
      const o = { v: VERSION };
      SAVED.forEach(k => { if (k !== 'v') o[k] = state[k]; });
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) { /* private mode / file:// — just don't persist */ }
  }

  function readRaw() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { o = null; }
    if (o && typeof o === 'object') return o;
    /* v1 had no version field and no job fields. Everything it did hold is
       still meaningful, so it is carried across rather than thrown away. */
    try {
      const old = JSON.parse(localStorage.getItem(LEGACY) || 'null');
      if (old && typeof old === 'object') return Object.assign({ v: 1 }, old);
    } catch (e) { /* fall through to defaults */ }
    return null;
  }

  function load(defaults, catalogue) {
    const state = Object.assign({}, defaults);
    let o;
    try { o = readRaw(); } catch (e) { return state; }
    if (!o) return state;
    const { rackets, strings, patterns, gauges } = catalogue;
    const take = (k, ok) => { if (ok(o[k])) state[k] = o[k]; };

    take('racketId', v => rackets.some(r => r.id === v));
    take('mainId',   v => strings.some(s => s.id === v));
    take('crossId',  v => strings.some(s => s.id === v));
    take('pattern',  v => v === 'stock' || patterns.includes(v));
    take('mainGauge',  v => gauges.includes(v));
    take('crossGauge', v => gauges.includes(v));
    ['mainColorIx', 'crossColorIx', 'step'].forEach(k =>
      take(k, v => Number.isFinite(v) && v >= 0));
    ['tMain', 'tCross'].forEach(k =>
      take(k, v => Number.isFinite(v) && v >= 35 && v <= 70));
    take('linkCross',    v => typeof v === 'boolean');
    take('linkTension',  v => typeof v === 'boolean');
    take('stepOpen',     v => typeof v === 'boolean');
    take('method',       v => v === 'one' || v === 'two');
    take('kind',      v => strings.some(s => s.type === v));
    take('crossKind', v => strings.some(s => s.type === v));
    take('tab', v => ['racket', 'string', 'do', 'learn'].includes(v));
    take('sub', v => ['words', 'tension', 'knots', 'machines'].includes(v));
    take('knot', v => v === 'finish' || v === 'start');
    take('card', v => Number.isInteger(v) && v >= 0 && v <= 3);
    take('mode', v => v === 'real' || v === 'sandbox');
    take('machineType', v => MACHINES.some(m => m.id === v));
    take('jobStatus', v => ['setup', 'active', 'complete'].includes(v));
    take('sideCard', v => ['racket', 'strings', 'job'].includes(v));
    take('purpose', v => PURPOSES.some(p => p.id === v));
    take('seenStart', v => typeof v === 'boolean');
    if (o.checked && typeof o.checked === 'object' && !Array.isArray(o.checked)) {
      const c = {};
      Object.keys(o.checked).forEach(k => { if (o.checked[k] === true) c[k] = true; });
      state.checked = c;
    }
    /* A sandbox pattern must never survive into real-racket mode: the frame is
       not drilled for it, and a stale override is exactly the kind of thing a
       returning user would not think to check. */
    if (state.mode === 'real') state.pattern = 'stock';
    return state;
  }

  function clear() {
    try { localStorage.removeItem(STORE); localStorage.removeItem(LEGACY); } catch (e) { /* ignore */ }
  }

  return { STORE, LEGACY, VERSION, MACHINES, MACHINE_NOTE, machine, MODES, PURPOSES, purpose,
           EXAMPLES, TERMS, MACHINE_TERMS, hadSaved,
           progress, hasProgress, hasChecks, save, load, clear };
})();
