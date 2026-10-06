/* Builds the step-by-step stringing job for the current configuration.
 * Every number in here comes from the actual geometry of the selected
 * pattern, hole sets and head size the user entered, so a 16x19 and an
 * 18x20 give different instructions. */
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
     * side. The two center mains are threaded from mainsStart and come out the
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
    /* Only the kind of string is chosen, so a string is named by its kind and
       thickness: "Synthetic gut 1.30 mm". */
    const mainWords = `${mainString.name} ${gMain.toFixed(2)} mm`;
    const crossWords = `${crossString.name} ${gCross.toFixed(2)} mm`;
    const sameString = mainString.id === crossString.id && gMain === gCross;

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
    const runDir = pl.crossFromTop ? 'head to throat' : 'throat to head';
    const runDirCap = pl.crossFromTop ? 'Head to throat' : 'Throat to head';
    const runTowards = pl.crossFromTop ? 'down to the throat' : 'up to the head';
    const other = end => (end === 'head' ? 'throat' : 'head');
    /* A one piece whose crosses have to start at the throat runs them bottom
       up. The plan is right about where the string is, but stringing references
       prefer crosses head to throat, so say so on that path only. */
    /* On a one piece the frame decides this: the crosses start wherever the
       long side's last main comes out. Bottom-up crosses are normal on a one
       piece (makers' own stringing sheets do it), so this only says that top
       down is preferred where the frame allows it. */
    const upNote = 'On this frame a one piece runs the crosses from the throat up. That is normal and many makers’ own instructions do it. Top down is preferred when the frame allows it, and two piece always does.';
    /* The one-piece line in the method step describes that method whichever
       one is selected, so it gets its own plan. */
    const plOne = plan(throatPairs, 'one', nC, nM);
    // One piece starts at the center mains: each side carries HALF the mains,
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
    // a tip, not a warning: which way a cross comes out tells you it was woven right
    const weaveTip = evenMains
      ? 'If you start with a cross going <b>under</b> the first main, then it must finish <b>over</b> the last one, and vice versa. If the cross starts and finishes <b>under</b>, or starts and finishes <b>over</b>, you have made a mistake.'
      : 'If you start with a cross going <b>under</b> the first main, it must also finish <b>under</b> the last one.';
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
      ${o.actions ? `<h4 class="step-sh">${o.actionsLabel || 'Do this'}</h4>
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
      body: layout({
        actionsLabel: 'Prepare',
        specs: [['Machine', mach.name], ['String', (mainString.id === crossString.id
                  ? mainString.name + ' ' : `${mainString.name} / ${crossString.name}, `)
                  + (gMain === gCross ? `${gMain.toFixed(2)} mm` : `${gMain.toFixed(2)} and ${gCross.toFixed(2)} mm`)]],
        actions: [
          `<b>String cutters</b>`,
          `<b>Needlenose pliers</b>, for pulling knots tight and easing string through a tight
           ${g('grommet')}.`,
          `<b>Measurement tool</b>, like a ruler or measuring tape.`,
          `<b>Eye protection</b>, for cutting out old strings. Polyester can snap back hard.`
        ],
        extra: HOLE_NOTE
      }),
      checks: ['Cutters, pliers and a measurement tool to hand']
    });

    steps.push({
      id: 'mount', stage: 'empty', title: 'Mount the racket',
      body: layout({
        specs: [['Position', `head at 12 o'clock`],
                ['Contact', 'frame only']],
        actions: [
          `Put the racket in the mount with the <b>head at 12 o'clock</b>.`,
          `Tighten the supports. Make sure the frame is stable and does not rock.`,
          `<b>Cut out the old strings</b>, if there are any. Cut the mains and crosses together, starting in
           the center and working outward, so the frame unloads evenly. Wear your eye protection.`
        ],
        watch: `Be careful not to overtighten.`,
        detail: `<p>A frame that rocks will shift on the first pull. Then everything you string after that is
            measured against a frame that moved.</p>`
      }),
      checks: ['Frame sits comfortably in the mount']
    });

    const cut = Fmt.cutPair(stats.mainM, stats.crossM);
    const cutM = Fmt.cutFor(stats, onePiece);
    const spare = Fmt.round1(setM - cutM);
    const tieLink = label =>
      `<button type="button" class="linkbtn inline-link" data-goto="knot" data-knot="finish">${label}</button>`;
    const MEASURE_TIP = `A handy way to measure: use your wingspan or your racket.`;
    const bothR = v => `<b>${Fmt.metres(v)}</b>`;
    /* A hybrid takes each plane from a different string, so there is no set to halve */
    const hybrid = mainString.id !== crossString.id;
    const mainKind = (mainString.type || mainString.name).toLowerCase();
    const crossKind = (crossString.type || crossString.name).toLowerCase();
    const hasGut = [mainString, crossString].some(x => /natural gut/i.test(x.type || x.name || ''));

    steps.push({
      id: 'measure', stage: 'empty', title: 'Measure your string',
      body: layout({
        specs: [['Method', `${onePiece ? 'One piece' : 'Two piece'}, ${onePiece ? 2 : 4} knots`],
                ['Cut length', Fmt.metres(cutM)],
                ['Left over from a 12.2 m set', Fmt.metres(spare)]],
        /* The method used to be a step of its own, after the cut. It decides
           the cut, so it is stated here, where the string is measured. */
        intro: `<p class="step-note">${onePiece
            ? 'One piece: one string does the mains and the crosses, with no starting knot.'
            : 'Two piece: one length for the mains and one for the crosses.'}
          Chosen on the String tab.${onePiece && mainString.id !== crossString.id
            ? ' <b>A hybrid needs two piece</b>, so change it there before you cut.' : ''}</p>`,
        actions: onePiece ? [
          `<b>Using a packaged set?</b> Open it and use all of the string. Do not trim it first.
           This job leaves about ${bothR(spare)} over.`,
          `<b>Cutting from a reel?</b> Measure ${bothR(cutM)}.`,
          `Mark the split before you thread anything. Pull the string off-center until roughly
           ${bothR(oneShort)} hangs on one side and the rest on the other. Keep it continuous,
           do not cut it into separate mains and cross pieces.`,
          MEASURE_TIP
        ] : hybrid ? [
          `<b>Hybrid:</b> cut the mains from your ${mainKind} and the crosses from your ${crossKind}, to the
           lengths below.`,
          `<b>Mains:</b> ${bothR(cut.mains)} of ${mainKind}. <b>Crosses:</b> ${bothR(cut.crosses)} of
           ${crossKind}.`,
          ...(hasGut ? [`Natural gut: don't kink it or grip it with pliers.`] : []),
          MEASURE_TIP
        ] : [
          /* A set is halved when half covers the mains. Dense frames (18 mains)
             need a little more than half, so the mains piece is cut first and
             the crosses take the rest. */
          cut.mains > setM / 2
            ? `<b>Using a packaged set?</b> Cut ${bothR(cut.mains)} for the mains and use the rest, about
               ${bothR(Fmt.round1(setM - cut.mains))}, for the crosses. This frame needs a little more than half
               for the mains.`
            : `<b>Using a packaged set?</b> Cut it into <b>two equal halves</b>, one for the mains and one for
           the crosses.`,
          `<b>Cutting from a reel?</b> Cut ${bothR(cut.mains)} for the mains and ${bothR(cut.crosses)} for
           the crosses.`,
          ...(hasGut ? [`Natural gut: don't kink it or grip it with pliers.`] : []),
          MEASURE_TIP
        ],
        watch: `Cutting too much is always better than cutting too little. If a piece comes up short, you have to start it again.`,
        detail: `<table class="mini">
            <tr><th>${nM} ${g('mains')}</th><td>≈ ${bothR(stats.mainM)}</td></tr>
            <tr><th>${nC} ${g('crosses')}</th><td>≈ ${bothR(stats.crossM)}</td></tr>
            <tr><th>Estimated string in the bed</th><td>≈ ${bothR(stats.totalM)}</td></tr>
            <tr class="cut-row"><th>Recommended cut length</th><td>${bothR(cutM)}</td></tr>
          </table>
`
      }),
      checks: [onePiece ? 'String measured and the split marked' : 'String measured and cut into two lengths']
    });


    steps.push({
      id: 'throat', stage: 'empty', title: `Check the throat: ${throatPairs} sets`,
      body: layout({
        specs: [['Hole sets', throatPairs], ['Mains start', pl.mainsStart],
                ['Mains finish', pl.mainsEnd]],
        actions: [
          `Just above the ${g('throat')}, count the <b>sets of main holes</b> again. A set is one pair of
           holes, one on each side of the center line.`,
          `You said <b>${throatPairs} sets</b>, so the mains start at the <b>${pl.mainsStart}</b> and
           finish at the <b>${pl.mainsEnd}</b>.`,
          `Counted ${throatPairs === 3 ? 4 : 3} instead? Change it on the
           <span class="nobr"><button type="button" class="linkbtn inline-link" data-goto="racket">Your racket</button></span>
           tab before you thread anything.`
        ],
        watch: `If the count is not obvious, most frames print the pattern and the tie-off holes inside the
          throat.`,
        // a real button, straight after the counting step, so nobody misses it
        extra: `<p class="throat-cta"><button type="button" class="btn primary" data-goto="throat">
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2 12.5 L8 3.5 L14 12.5" fill="none"
            stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="5.2" cy="11" r="1.1" fill="currentColor"/>
            <circle cx="8" cy="11" r="1.1" fill="currentColor"/><circle cx="10.8" cy="11" r="1.1" fill="currentColor"/></svg>
          Tilt the frame and count the holes</button></p>`,
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
      id: 'start', stage: 'start', title: 'Start the first two mains',
      body: layout({
        specs: [['Feed from', pl.mainsStart], ['Loose ends at', pl.firstMainEnd], ['Tension', `${tMain} lb`]],
        actions: [
          onePiece
            ? `<b>Thread the center pair.</b> Find the split you marked. Push one end through each of the two
               center holes at the ${pl.mainsStart}, so the mark sits against the outside of the frame and about
               ${bothR(oneShort)} hangs on the short side.`
            : `<b>Thread the center pair.</b> Fold the mains piece in half. Push one end through each of the two
               center holes at the ${pl.mainsStart}, so the fold sits against the outside of the frame. Pull the
               ends even.`
        ],
        extra: `<h4 class="step-sh">Walk it through</h4>
          <p class="hint beat-hint"><button type="button" class="btn ghost play-btn" data-beat="play">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>
            Play</button> or click a card to see that moment on the racket.</p>
          <div class="cycle">
            <button class="cycle-card" data-beat="1"><span>1</span><b>Thread</b>
              <em>Feed both center mains in from the ${pl.mainsStart}. The loose ends come out at the ${pl.firstMainEnd}.</em></button>
            <button class="cycle-card" data-beat="2"><span>2</span><b>Clamp</b>
              <em>Clamp the left center main at the ${pl.mainsStart}, so it cannot slip back.</em></button>
            <button class="cycle-card" data-beat="3"><span>3</span><b>Tension</b>
              <em>Pull the right center main at the ${pl.firstMainEnd}, to ${tMain} lb.</em></button>
            <button class="cycle-card" data-beat="4"><span>4</span><b>Clamp</b>
              <em>Clamp the right one at the ${pl.firstMainEnd}.</em></button>
            <button class="cycle-card" data-beat="5"><span>5</span><b>Tension</b>
              <em>Take off the clamp from card 2, then pull the left one at the ${pl.firstMainEnd}, to ${tMain} lb.</em></button>
            <button class="cycle-card" data-beat="6"><span>6</span><b>Clamp</b>
              <em>Clamp the left one at the ${pl.firstMainEnd}. Both are now at tension.</em></button>
          </div>`,
        jump: `<button class="linkbtn" data-goto="tension">When to clamp on each machine</button>`
      }),
      checks: [onePiece
                 ? `Center pair threaded, short side about ${Fmt.metres(oneShort)}`
                 : 'Center pair threaded and evened up',
               'Both center mains at tension and clamped']
    });

    steps.push({
      id: 'mains', stage: 'mains', title: `String the ${nM} mains`,
      body: layout({
        specs: [['Direction', `from the ${pl.mainsStart}`], ['Mains', `${nM} (${nM / 2} a side)`],
                ['Tension', `${tMain} lb`], ['Tie off at', pl.mainsEnd]],
        actions: [
          `<b>Thread.</b> Take the string around the outside of the frame and through the next main hole.
           Skip any hole your frame keeps for the crosses.`,
          `<b>Tension.</b> Pull that main to ${tMain} lb.`,
          `<b>Clamp.</b> Clamp it close to the ${g('grommet')}, without touching the frame. Only let the
           machine go once the clamp is on and holding the tension.`,
          `<b>Repeat</b> thread, tension, clamp, <b>alternating sides</b>, so neither side gets more than one
           main ahead. Keep going until the last main on each side.`,
          onePiece
            ? `Tie off the <b>short side only</b> at the ${pl.mainsEnd} with the <span class="nobr">${tieLink('finishing tie-off')}.</span>
               The long side is left free and carries on into the crosses.`
            : `Tie both ends off at the marked ${pl.mainsEnd} ${g('tie-off')} holes with the
               <span class="nobr">${tieLink('finishing tie-off')}.</span> Keep the clamp on until the knot is pulled tight.`
        ],
        watch: `If you just use the next free hole, a main can end up in a hole meant for a cross. If a grommet
          looks more <span class="nobr"><button type="button" class="linkbtn inline-link" data-goto="grommets">horizontal</button>,</span>
          it is probably meant for a cross string.`,
        detail: `<p><b>Why balance matters.</b> If you do several mains on one side before going back to the other,
            the frame is pulled unevenly until you catch up. Over time that can warp the racket.</p>
          <p>String: <b>${mainString.name}</b> ${gMain.toFixed(2)} mm &middot; main spacing
            ${stats.mainGap.toFixed(1)} mm.</p>`
      }),
      checks: ['Center mains in and symmetric', 'Skipped holes verified against the frame',
               onePiece
                 ? `Short-side main tied off at the ${pl.mainsEnd}, long side left free for the crosses`
                 : `Mains tied off at the marked ${pl.mainsEnd} holes`]
    });

    steps.push({
      id: 'crosses', stage: 'crosses', title: `Weave the ${nC} crosses`,
      body: layout({
        specs: [['Direction', runDir], ['Crosses', nC], ['Tension', `${tCross} lb`],
                ['Final knot', crossEndEnd]],
        actions: [
          onePiece
            ? `The long side comes out of the last main at the <b>${pl.mainsEnd}</b> and goes straight into
               the first cross, with no starting knot needed.`
            : `Tie the <b>starting knot</b> around the main in the marked
               <span class="nobr"><button type="button" class="linkbtn inline-link" data-goto="starthole">starting hole</button>,</span>
               next to the first cross. Then run the string along the outside of the frame into the first cross hole.`,
          `Weave each cross over one main and under the next, all the way across. Pull the whole length
           through before you tension it.`,
          `Tension it, then clamp close to the frame. Straighten that cross with your fingers before moving on.`,
          `Start each new cross the opposite way to the last one. If it went <b>over</b> the first main, this
           one goes <b>under</b>.`,
          `Tie off the final cross at the ${crossEndEnd} with the <span class="nobr">${tieLink('finishing tie-off')}.</span> Keep the
           clamp on until the knot is pulled tight.`
        ],
        extra: `<p class="step-tip"><b>Tip:</b> ${weaveTip}</p>
          <p class="quiz-cta"><button type="button" class="btn quiz-btn" data-goto="weavequiz">
            <span class="quiz-ico" aria-hidden="true">?</span>Test yourself: the weaving quiz</button></p>`,
        watch: onePiece && crossUp ? upNote : '',
        jump: onePiece
          ? `<button class="linkbtn" data-goto="knot" data-knot="finish">Show the finishing tie-off</button>`
          : `<button type="button" class="btn knot-btn" data-goto="knot" data-knot="start">
              <span class="quiz-ico" aria-hidden="true">&#8734;</span>Show the starting knot</button>`
      }),
      checks: [onePiece
                 ? `Crosses started at the ${crossStartEnd}, running ${runDir}`
                 : 'Starting knot stayed on the stringbed side, snug against the grommet, during the first pull',
               'Every cross alternates correctly',
               `Final knot tied at the ${crossEndEnd} and trimmed`]
    });

    steps.push({
      id: 'finish', stage: 'done', title: 'Finish and check',
      body: layout({
        specs: [['In the bed', `≈ ${Fmt.metres(stats.totalM)}`], ['Knots', onePiece ? 2 : 4]],
        intro: done
          ? `<p class="done-banner"><b>Congratulations, the racket is strung.</b>
             ${pat}, ${mainWords} at ${tMain} lb${!sameString || tMain !== tCross
               ? ' / ' + (sameString ? '' : crossWords + ' at ') + tCross + ' lb' : ''},
             ${onePiece ? 'one piece' : 'two piece'}.</p>`
          : '',
        actions: [
          `Unmount the racket.`,
          `Give the strings one last look and check that the crosses are straight and evenly spaced.`,
          `Write down the string, tension and date: ${mainWords} at ${tMain} lb${
           sameString && tMain === tCross ? ''
             : ` / ${sameString ? '' : crossWords + ' at '}${tCross} lb`}, ${pat},
           ${onePiece ? 'one piece' : 'two piece'}, ${Fmt.today()}.`
        ],
        watch: settleNote
      }),
      checks: ['Stringbed straightened', 'String, tension and date noted']
    });

    return steps;
  }

  return { build, startEnd, plan };
})();
