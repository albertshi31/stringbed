/* Builds the step-by-step stringing job for the current configuration.
 * Every number in here comes from the actual geometry of the selected
 * racket + pattern, so a 16x19 and an 18x20 give different instructions. */
const Steps = (function () {

  /* the article lives in Fmt now, so the guide and the wizard agree */

  /* Where the mains start is decided by the frame, not by preference:
   * 3 sets of holes at the throat -> start at the bottom (throat),
   * 4 sets -> start at the top (head).  */
  function startEnd(throatPairs) {
    return throatPairs === 3 ? 'bottom' : 'top';
  }

  /* THE PLAN: which end each run starts and finishes at, and which SIDE each
   * knot lands on. Everything that draws a knot, captions a step or animates a
   * string reads it from here -- these facts were being re-derived in three
   * places from `throatPairs === 4`, and they disagreed.
   *
   * Ends. A one-piece has no cut: when the mains are done the string is already
   * hanging out of the end they finished at, so that is where the crosses
   * begin. There is no choice about it. A two-piece cross bunch is a fresh
   * length and starts at the head, as good as always.
   *
   * Sides. On a one piece the long side carries every cross, so the only mains
   * knot is on the SHORT side, and the crosses set off from the long side. Each
   * cross then crosses the bed and comes back, so the string changes side on
   * every one: after an ODD number of crosses it finishes on the far side from
   * where it started, after an EVEN number it finishes on the same side.
   *
   * That parity is the whole answer to "which side do the two knots end up on":
   *   16x19 one piece -> 19 crosses, odd  -> finishes back on the short side,
   *                                          so both knots are on the SAME side
   *   18x20 one piece -> 20 crosses, even -> finishes on the long side, so the
   *                                          two knots are on OPPOSITE sides
   */
  const LEFT = -1, RIGHT = 1;
  function plan(throatPairs, method, crossCount, mainCount) {
    const onePiece = method === 'one';
    const mainsStart = startEnd(throatPairs) === 'bottom' ? 'throat' : 'head';

    /* WHERE THE MAINS FINISH is not simply the far end from where they began.
     * The free end ALTERNATES: up one main, round the frame, down the next. So
     * after an even number of mains on a side it is back at the end it set off
     * from, and after an odd number it is at the other one:
     *
     *   start throat + even per side -> throat     start head + even -> head
     *   start throat + odd  per side -> head       start head + odd  -> throat
     *
     * Treating it as "always the opposite end" was right only for the 18-main
     * frames, where the per-side count happens to be odd. It put the tie-offs
     * at the wrong end of every 16-main frame. The mains animation has always
     * alternated correctly; it was this that disagreed with it. */
    const perSide = Math.round((mainCount || 16) / 2);
    const sameEnd = perSide % 2 === 0;
    const mainsEnd = sameEnd ? mainsStart : (mainsStart === 'throat' ? 'head' : 'throat');
    /* The FIRST pull is a different fact from where the mains FINISH, and
     * conflating them is wrong on every frame with an even number of mains per
     * side. The two centre mains are threaded from mainsStart and come out the
     * other end -- always -- so that is where the slack hangs, where the
     * gripper goes and where the first clamp lands. Only after an even number
     * of mains per side does the free end walk back to the end it started
     * from, which is what mainsEnd records. On a 16-main throat-start frame
     * the first mains go to the HEAD and the last ones tie off at the THROAT. */
    const firstMainEnd = mainsStart === 'throat' ? 'head' : 'throat';
    const crossStart = onePiece ? mainsEnd : 'head';
    const crossEnd = crossStart === 'head' ? 'throat' : 'head';
    // one piece: short side knots the mains, long side runs on into the crosses
    const crossStartSide = onePiece ? RIGHT : LEFT;
    const mainsEndSide = onePiece ? -crossStartSide : 0;   // 0 = one knot each side
    const crossEndSide = crossCount % 2 === 1 ? -crossStartSide : crossStartSide;
    return {
      onePiece: onePiece,
      mainsStart: mainsStart, mainsEnd: mainsEnd, firstMainEnd: firstMainEnd,
      crossStart: crossStart, crossEnd: crossEnd,
      crossFromTop: crossStart === 'head',
      mainsEndSide: mainsEndSide,
      crossStartSide: crossStartSide, crossEndSide: crossEndSide,
      knotsSameSide: onePiece && crossEndSide === mainsEndSide
    };
  }

  function build(cfg) {
    const { racket, bed, stats, method, throatPairs, mainString, crossString,
            tMain, tCross } = cfg;
    const mach = Job.machine(cfg.machineType);
    /* Set by the caller once it has counted the ticked checks against these
       very steps. False on the first pass, which is what the count is made
       from; the caller rebuilds when it turns out to be true. */
    const done = !!cfg.jobComplete;
    /* a word the reader may not have met yet, defined where it first appears */
    /* same device as the bench: no native title, so the cursor cannot flicker */
    const g = (term, label) => `<abbr class="term" tabindex="0" data-term="${term}">${label || term}` +
      `<span class="sr-only">: ${Job.TERMS[term]}</span></abbr>`;
    const gMain = cfg.gMain || mainString.gauge, gCross = cfg.gCross || crossString.gauge;

    const nM = bed.mains.length, nC = bed.crosses.length;
    const pat = bed.patternLabel;
    const onePiece = method === 'one';
    const setM = 12.2; // a standard 40 ft set
    const evenMains = nM % 2 === 0;
    /* THE PLAN IS THE ONLY SOURCE OF ROUTING. Nothing below decides an end or a
     * direction for itself; every sentence, caption and checklist item reads
     * one of these. Wording used to be written out per step from
     * `throatPairs === 3`, which is how the guide ended up telling you the
     * mains finish at the head on a frame where they finish at the throat. */
    const pl = plan(throatPairs, method, nC, nM);
    const crossUp = !pl.crossFromTop;
    const crossStartEnd = pl.crossStart;
    const crossEndEnd = pl.crossEnd;
    const runDir = pl.crossFromTop ? 'top down' : 'bottom up';
    const runDirCap = pl.crossFromTop ? 'Top down' : 'Bottom up';
    const runTowards = pl.crossFromTop ? 'down to the throat' : 'up to the head';
    const other = end => (end === 'head' ? 'throat' : 'head');
    /* A one piece whose crosses have to start at the throat runs them bottom
       up. The plan is right about where the string is, but stringing references
       prefer crosses head to throat, so say so on that path only. */
    /* On a one piece the frame decides this: the crosses start wherever the
       long side's last main comes out. Throat up is normal then, just a little
       harder on the frame, so it is a notice, not a warning off the method. */
    const upNote = 'On this frame the crosses go from the throat up, which is fine. It just puts a little more stress on the frame, so check it stays square in the mounts.';
    /* The one-piece line in the method step describes that method whichever
       one is selected, so it gets its own plan. */
    const plOne = plan(throatPairs, 'one', nC, nM);
    // One piece starts at the centre mains: each side carries HALF the mains,
    // and the long side carries every cross on top of that.
    const oneShort = Fmt.splitOne(stats.mainM, stats.crossM).short;

    // A cross that goes UNDER the first main must come OUT OVER the last one
    // whenever the main count is even (16, 18, 20 all are).
    /* The tension-loss note was hard-coded to polyester and shown on a gut or
       multi job, where it is simply not true. It reports on the strings that
       are actually selected, and stays neutral when neither is a poly. */
    const isPoly = st => /polyester/i.test(st.type || '');
    const polyM = isPoly(mainString), polyC = isPoly(crossString);
    /* Every string drops about 10 to 15% in its first day. Polyester is not
       different in kind, it just drops fastest and then goes dead sooner. */
    const settleNote = (polyM && polyC)
      ? 'Every string loses about 10 to 15% of its tension in the first day, and polyester loses it fastest. Play with it for a bit before you judge it.'
      : (polyM || polyC)
        ? `Every string loses about 10 to 15% of its tension in the first day, and the polyester ${polyM ? 'mains' : 'crosses'} lose it fastest. Play with it for a bit before you judge it.`
      : 'Every string loses about 10 to 15% of its tension in the first day, then settles. Play with it for a bit before you judge it.';

    /* The check a weaver actually runs, in one line. The reasoning behind it and
       what to do when it fails are real and stay in the guide -- they move into
       More detail, because at the moment you are looking at the bed you need
       the rule, not the derivation. */
    const weaveRule = evenMains
      ? 'On this frame, a cross that <b>starts under</b> must <b>finish over</b>.'
      : 'On this frame, a cross that <b>starts under</b> also <b>finishes under</b>.';
    const weaveWhy = evenMains
      ? `<p><b>Why that is the check.</b> This frame has an <b>even</b> number of mains (${nM}), so a
         cross alternating over and under across all of them comes out the far side on the opposite
         face from the one it went in on. If it finishes <em>under</em>, you have missed one somewhere.
         Pull that cross back out and re-weave it. Do not try to fix it in place, because dragging a
         badly woven cross through under tension cuts grooves into the mains.</p>`
      : `<p><b>Why that is the check.</b> This frame has an <b>odd</b> number of mains (${nM}), so a
         cross comes out the far side on the same face it went in on. Count the overs and unders as you
         go. With an odd count, checking the end of the row will not catch a mistake for you.</p>`;

    /* EVERY STEP IS LAID OUT THE SAME WAY, so a reader learns the shape once
       and then only has to read the parts that change:
         the numbers that matter -> what to do -> the one mistake -> what to tick.
       Reasoning, edge cases and the long disclaimers go behind MORE DETAIL.
       Nothing is deleted by that -- it is all still in the page and still
       searchable -- but it stops competing with the instruction. */
    const layout = o => `
      ${o.specs && o.specs.filter(Boolean).length
        ? `<ul class="spec-strip">${o.specs.filter(Boolean)
            .map(([k, v]) => `<li><em>${k}</em><b>${v}</b></li>`).join('')}</ul>` : ''}
      ${o.intro || ''}
      ${o.actions ? `<h4 class="step-sh">Do this</h4>
        <ol class="do-this">${o.actions.filter(Boolean).map(x => `<li>${x}</li>`).join('')}</ol>` : ''}
      ${o.extra || ''}
      ${o.watch ? `<div class="watch-for"><h4>Watch for</h4><p>${o.watch}</p></div>` : ''}
      ${o.jump ? `<p class="jump">${o.jump}</p>` : ''}
      ${o.detail ? `<details class="why more-detail"><summary>More detail</summary>
        <div>${o.detail}</div></details>` : ''}`;

    /* Said once, in the first step. Repeating it on every step had stopped it
       being read anywhere. */
    const HOLE_NOTE = `<p class="note hole-note">Positions in the diagrams are a guide. Check the
      tie-off and skipped holes against your own frame.</p>`;

    const steps = [];

    steps.push({
      id: 'tools', stage: 'empty', title: 'Get ready',
      lede: 'Old strings out and tools to hand before you start.',
      body: layout({
        specs: [['Machine', mach.name], ['String thickness', gMain === gCross
                  ? `${gMain.toFixed(2)} mm` : `${gMain.toFixed(2)} and ${gCross.toFixed(2)} mm`]],
        actions: [
          `Restringing? <b>Cut the old strings out first</b>, starting in the centre and working outwards.`,
          `Get the machine and its clamps ready. Yours is set to <b>${mach.name.toLowerCase()}</b>,
           so change it on the bench if that is wrong.`,
          `<b>String cutters</b>, or any cutter that will go through ${Math.max(gMain, gCross).toFixed(2)} mm cleanly.`,
          `<b>Needlenose pliers</b>, for pulling knots tight and easing string through a tight
           ${g('grommet')}.`,
          `<b>Something to measure with</b>, like a ruler or a tape.`
        ],
        extra: HOLE_NOTE,
        watch: `Test a clamp on a scrap piece before you start. A clamp that slips costs that string its
          tension, and you will not find out until the racket is strung.`,
        detail: `<p>Cut from the centre outwards so both halves of the frame lose their tension together.
            Cutting from one side leaves the other side pulling on the frame unevenly.</p>`
      }),
      checks: ['Old strings cut out from the centre outwards', 'Machine and clamps ready',
               'Cutters, pliers and something to measure to hand']
    });

    steps.push({
      id: 'mount', stage: 'empty', title: 'Mount the racket',
      lede: 'Get it straight and held firm before you pull a single string.',
      body: layout({
        specs: [['Head', `${racket.headSize} in²`], ['Position', `head at 12 o'clock`],
                ['Contact', 'frame only']],
        actions: [
          `Seat the ${racket.brand} ${racket.model} in the mounting system with the
           <b>head at 12 o'clock</b>.`,
          `Tighten the supports until the frame cannot turn. Firm is enough, then stop.`,
          `Press the tip and the throat. The frame must not rock.`
        ],
        watch: `The supports touch the frame on the <b>outside</b> of the hoop, never inside the stringbed.
          Tightening them too much can bend a ${racket.headSize} in² hoop out of shape.`,
        detail: `<p>A frame that rocks will shift on the first pull. Then everything you string after that is
            measured against a frame that moved.</p>`
      }),
      checks: ['Frame square and rigid in the machine']
    });

    const cut = Fmt.cutPair(stats.mainM, stats.crossM);
    const cutM = Fmt.cutTotal(stats.totalM, onePiece);
    const spare = Fmt.round1(setM - cutM);
    const m1 = v => Fmt.round1(v).toFixed(1);
    const bothR = v => `<b>${Fmt.metresOnly(v)}</b> (${Fmt.feet(v)})`;

    steps.push({
      id: 'measure', stage: 'empty', title: 'Measure your string',
      lede: spare >= 0
        ? `Cut about ${Fmt.metresOnly(cutM)}. A standard ${setM} m (40 ft) set covers it.`
        : `Cut about ${Fmt.metresOnly(cutM)}. A standard ${setM} m (40 ft) set is tight, so keep your tails short.`,
      body: layout({
        specs: [['In the bed', `≈ ${Fmt.metresOnly(stats.totalM)}`],
                ['Cut length', Fmt.metresOnly(cutM)],
                [spare >= 0 ? 'Set spare' : 'Set short', `${m1(Math.abs(spare))} m`]],
        actions: [
          onePiece
            ? `<b>Using a packaged set?</b> Open it and string the whole thing. Do not trim it first.
               ${spare >= 0 ? `This job leaves about <b>${m1(spare)} m</b> over.`
                            : `It is about <b>${m1(-spare)} m</b> short of the length above, so keep both tails to about 30 cm.`}`
            : spare >= 0
              ? `<b>Using a packaged set?</b> Cut it into the two lengths below and string the whole thing.
                 A set is sized for a normal adult racket, and this job leaves about
                 <b>${m1(spare)} m</b> over.`
              : `<b>Using a packaged set?</b> It is about <b>${m1(-spare)} m</b> short of the lengths below,
                 so cut it in two in the same proportion and keep every tail to about 30 cm. Or cut from a reel.`,
          `<b>Cutting from a reel?</b> Measure <b>${Fmt.metresOnly(cutM)}</b> (${Fmt.feet(cutM)}).`,
          onePiece
            ? `Mark the split before you thread anything. Pull the string off-centre until roughly
               <b>${m1(oneShort)} m</b> hangs on one side and the rest on the other. Keep it continuous,
               do not cut it into separate mains and cross pieces.`
            : `Cut <b>two separate lengths</b>: ${bothR(cut.mains)} for the mains and
               ${bothR(cut.crosses)} for the crosses.${Math.abs(cut.mains - cut.crosses) >= 0.2
                 ? ' Do not just cut it in half. Each piece is sized for its own direction.' : ''}`
        ],
        watch: `Coming up short means starting that piece again. A few spare centimetres cost nothing, so
          if you are unsure, cut it longer.`,
        detail: `<table class="mini">
            <tr><th>${nM} ${g('mains')}</th><td>≈ ${bothR(stats.mainM)}</td></tr>
            <tr><th>${nC} ${g('crosses')}</th><td>≈ ${bothR(stats.crossM)}</td></tr>
            <tr><th>Estimated string in the bed</th><td>≈ ${bothR(stats.totalM)}</td></tr>
            <tr class="cut-row"><th>Recommended cut length</th><td>${bothR(cutM)}</td></tr>
          </table>
          <p>The cut adds the ${onePiece ? 'two ends' : 'four ends'} the machine grabs and you tie off.</p>`
      }),
      checks: ['String measured or set opened',
               onePiece ? 'Long side and short side split marked' : 'Two lengths cut']
    });

    steps.push({
      id: 'throat', stage: 'empty', title: 'Read the throat: 3 sets or 4?',
      lede: 'The frame decides which end the mains start from. Look before you thread.',
      body: layout({
        specs: [['Hole sets', throatPairs], ['Mains start', pl.mainsStart],
                ['Mains finish', pl.mainsEnd]],
        actions: [
          `Look at the bottom of the hoop, right above the ${g('throat')}.`,
          `Count the <b>sets of main holes</b> either side of the centre line.`,
          `<b>3 sets</b> → the mains start at the throat. <b>4 sets</b> → they start at the head.`,
          `This racket is set to <b>${throatPairs} sets</b>, so the mains start at the
           <b>${pl.mainsStart}</b> and finish at the <b>${pl.mainsEnd}</b>.`
        ],
        watch: `If the count is not obvious, most frames print the pattern and the tie-off holes inside the
          throat. Read them rather than guessing.`,
        jump: `<button class="linkbtn" data-goto="throat">Tilt the frame and count the holes</button>`,
        detail: `<div class="rule-cards">
            <div class="rule-card ${throatPairs === 3 ? 'on' : ''}"><span class="rc-n">3 sets</span><span class="rc-t">Thread the first two mains from the <b>throat</b>.</span></div>
            <div class="rule-card ${throatPairs === 4 ? 'on' : ''}"><span class="rc-n">4 sets</span><span class="rc-t">Thread the first two mains from the <b>head</b>.</span></div>
          </div>
          ${onePiece
            ? `<p>One piece: the string is still attached when the mains are done, so the crosses simply
               carry on from the ${pl.crossStart} and run <b>${runDir}</b>, finishing at the
               ${pl.crossEnd}.</p>` : ''}`
      }),
      checks: ['Throat hole sets counted']
    });

    steps.push({
      id: 'method', stage: 'empty', title: `Method: ${onePiece ? 'one piece' : 'two piece'}`,
      lede: onePiece ? 'One continuous string, two knots.' : 'Two lengths, four knots, and you can mix two strings.',
      body: layout({
        specs: [['Method', onePiece ? 'One piece' : 'Two piece'], ['Knots', onePiece ? 2 : 4],
                [g('hybrid'), onePiece ? 'not possible' : 'possible']],
        intro: `<div class="seg step-seg">
            <button type="button" data-method="one" class="${onePiece ? 'on' : ''}"
              aria-pressed="${onePiece ? 'true' : 'false'}">One piece</button>
            <button type="button" data-method="two" class="${!onePiece ? 'on' : ''}"
              aria-pressed="${!onePiece ? 'true' : 'false'}">Two piece</button>
          </div>`,
        actions: [
          `<b>One piece:</b> one string does the mains and the crosses, so there is no starting knot. The crosses
           begin wherever the mains finished. On this frame, that is the ${plOne.crossStart}.`,
          `<b>Two piece:</b> two lengths, each with its own start and finish. Needed for a
           ${g('hybrid')} or a split tension, and it works on any frame.`
        ],
        watch: mainString.id !== crossString.id
          ? `You have a hybrid selected (${mainString.name} / ${crossString.name}). That needs
             <b>two piece</b>.`
          : onePiece && crossUp
            ? upNote
          : tMain !== tCross
            ? `Mains ${tMain} lb and crosses ${tCross} lb is a split tension. It works either way, but is easiest
               with two piece.`
            : `On a one piece, a mistake late in the crosses costs you the whole set. On a two piece it only
               costs the cross piece.`
      }),
      checks: []
    });

    steps.push({
      id: 'start', stage: 'start', title: 'Start the first two mains',
      lede: 'Thread the two centre strings, then pull and clamp, pull and clamp.',
      body: layout({
        specs: [['Feed from', pl.mainsStart], ['Slack at', pl.firstMainEnd], ['Tension', `${tMain} lb`]],
        actions: [
          onePiece
            ? `Thread the centre pair and leave about <b>${Fmt.metresOnly(oneShort)}</b> on the short side.`
            : `Thread the centre pair and even the lengths.`
        ],
        extra: `<h4 class="step-sh">Walk it through</h4>
          <div class="cycle">
            <button class="cycle-card" data-beat="1"><span>1</span><b>Thread</b>
              <em>Both centre mains from the ${pl.mainsStart}.</em></button>
            <button class="cycle-card" data-beat="2"><span>2</span><b>Clamp</b>
              <em>One at the ${pl.mainsStart}, opposite the slack.</em></button>
            <button class="cycle-card" data-beat="3"><span>3</span><b>Tension</b>
              <em>The other at the ${pl.firstMainEnd}, to ${tMain} lb.</em></button>
            <button class="cycle-card" data-beat="4"><span>4</span><b>Clamp</b>
              <em>Clamp it at the ${pl.firstMainEnd}.</em></button>
            <button class="cycle-card" data-beat="5"><span>5</span><b>Tension</b>
              <em>Pull the first string, then release its clamp.</em></button>
            <button class="cycle-card" data-beat="6"><span>6</span><b>Clamp</b>
              <em>Both centre mains now at tension.</em></button>
          </div>
          <p class="hint">Click a card to see that moment on the racket, or
            <button class="linkbtn" data-beat="play">play it through</button>.</p>`,
        watch: `The clamp goes on the string you just pulled, inside the frame and close to its hole. Never put
          it on the one you are about to pull.`,
        jump: `<button class="linkbtn" data-goto="tension">When to clamp on each machine</button>`,
        detail: `<p class="machine-note"><b>On a ${mach.name.toLowerCase()}:</b> ${mach.id === 'dropweight'
            ? 'Clamp when the bar settles level. If it stops off level, lift it and let go again.'
            : `${mach.clamp} <span>${mach.why}</span>`}</p>
          <p>From here the two clamps take turns moving outwards. Every pull is the same few moves: pull, clamp,
            release, next string. That stays the same for the rest of the job.</p>`
      }),
      checks: ['Centre pair threaded and evened up', 'Both centre mains at tension and clamped']
    });

    steps.push({
      id: 'mains', stage: 'mains', title: `String the ${nM} mains`,
      lede: `Outward from the centre, alternating sides, at ${tMain} lb.`,
      body: layout({
        specs: [['Direction', `from the ${pl.mainsStart}`], ['Mains', `${nM} (${nM / 2} a side)`],
                ['Tension', `${tMain} lb`], ['Tie off at', pl.mainsEnd]],
        actions: [
          `Work outward from the centre, one main at a time on each side.`,
          `<b>Alternate sides.</b> Tension and clamp one, then the matching one on the other side. Never get more
           than one main ahead on either side.`,
          `Clamp as close to the ${g('grommet')} as you can without touching the frame.`,
          `<b>Skip the holes this racket reserves for the crosses.</b> Not every grommet near the sides
           belongs to a main.`,
          onePiece
            ? `Tie off the <b>short side only</b> at the ${pl.mainsEnd}. The long side is left free and
               carries on into the crosses.`
            : `Tie both ends off at the marked ${pl.mainsEnd} ${g('tie-off')} holes.`
        ],
        watch: `If you just use the next free hole, a main can end up in a hole meant for a cross.`,
        detail: `<p><b>Why the clamp alternates ends.</b> After each pull the string loops around the outside of
            the frame and enters the next main hole, so your next pull on that side comes from the opposite
            end of the racket. The clamp follows it.</p>
          <p><b>Why balance matters.</b> If you do several mains on one side before going back to the other,
            the frame is pulled unevenly until you catch up.</p>
          <p>String: <b>${mainString.name}</b> ${gMain.toFixed(2)} mm &middot; main spacing
            ${stats.mainGap.toFixed(1)} mm.</p>`
      }),
      checks: ['Centre mains in and symmetric', 'Skipped holes verified against the frame',
               onePiece
                 ? `Short-side main tied off at the ${pl.mainsEnd}, long side left free for the crosses`
                 : `Mains tied off at the marked ${pl.mainsEnd} holes`]
    });

    steps.push({
      id: 'crosses', stage: 'crosses', title: `Weave the ${nC} crosses`,
      lede: `${runDirCap} from the ${crossStartEnd}, over, under, over, at ${tCross} lb.`,
      body: layout({
        specs: [['Direction', runDir], ['Crosses', nC], ['Tension', `${tCross} lb`],
                ['Final knot', crossEndEnd]],
        actions: [
          onePiece
            ? `The long side comes out of the last main at the <b>${pl.mainsEnd}</b> and goes straight into
               the first cross, with no starting knot needed.`
            : `Tie the <b>starting knot</b> around the main in the marked starting hole, next to the
               first cross. Then run the string along the outside of the frame into the first cross hole.`,
          `Weave each cross <b>over, under, over, under</b> across all ${nM} mains before you tension it.
           Start each one the opposite way to the cross before it: if that one started over a main, this one starts under.`,
          `Tension, then clamp close to the frame.`,
          `Straighten that cross with your fingers before moving on.`,
          `Tie off the final cross at the ${crossEndEnd} with the <b>finishing tie-off</b> and trim to
           about 4 mm.`
        ],
        watch: `Each cross must alternate. ${weaveRule}${onePiece && crossUp ? ' ' + upNote : ''}`,
        jump: onePiece
          ? `<button class="linkbtn" data-goto="knot" data-knot="finish">Show the finishing tie-off</button>`
          : `<button class="linkbtn" data-goto="knot" data-knot="start">Show the starting knot</button>`,
        detail: weaveWhy + (onePiece
          ? `<p>One piece, <b>two knots, one at each end</b>. The mains knot is the short side's tie-off at
              the ${pl.mainsEnd}. The long side is <b>not</b> knotted there. It carries on into the
              crosses from the ${pl.crossStart}, so the second and last knot is the cross tie-off at the
              ${pl.crossEnd}.</p>`
          : `<p>The tail goes through the marked tie-off hole and the knot is tied around an installed main.</p>
             <p>Pull the first cross slowly. If the knot moves toward the grommet, release and retie it.</p>`)
          + `<p>Pull the string through at a low angle and take your time. Dragging poly across poly
              fast burns grooves into the mains.</p>
            <p>Work ${runTowards}. The last few get tight. An awl to open up the grommet helps more
              than force.</p>
            <p>String: <b>${crossString.name}</b> ${gCross.toFixed(2)} mm &middot; cross spacing
              ${stats.crossGap.toFixed(1)} mm &middot; total knots <b>${onePiece ? 2 : 4}</b>.</p>`
      }),
      checks: [onePiece
                 ? `Crosses started at the ${crossStartEnd}, running ${runDir}`
                 : 'Starting knot remained outside the grommet during the first pull',
               'Every cross alternates correctly',
               `Final knot tied at the ${crossEndEnd} and trimmed`]
    });

    steps.push({
      id: 'finish', stage: 'done', title: 'Finish and check',
      lede: 'Straighten the bed, then note down the job.',
      body: layout({
        specs: [['Stiffness', `${stats.dt.toFixed(0)} (${stats.feel})`],
                ['In the bed', `≈ ${Fmt.metresOnly(stats.totalM)}`], ['Knots', onePiece ? 2 : 4]],
        intro: done
          ? `<p class="done-banner"><b>Congratulations, the racket is strung.</b>
             ${pat}, ${mainString.name} at ${tMain} lb${crossString.id !== mainString.id || tMain !== tCross
               ? ' / ' + crossString.name + ' at ' + tCross + ' lb' : ''},
             ${onePiece ? 'one piece' : 'two piece'}.</p>`
          : `<p class="note">When you have finished stringing, work through the checks below. Once they are
             all ticked, this step becomes your job record.</p>`,
        actions: [
          `Unmount the racket.`,
          `Give the strings one last look and check that the crosses are straight and evenly spaced.`,
          `Write down the string, tension and date: ${mainString.name} at ${tMain} lb${
           mainString.id === crossString.id && tMain === tCross ? ''
             : ` / ${crossString.name} at ${tCross} lb`}, ${pat},
           ${onePiece ? 'one piece' : 'two piece'}, ${Fmt.today()}.`
        ],
        watch: settleNote,
        detail: `<p>The stiffness figure is an estimate.</p>`
      }),
      checks: ['Stringbed straightened', 'String, tension and date noted']
    });

    return steps;
  }

  return { build, startEnd, plan };
})();
