/* Numbers as a person should read them.
 *
 * The estimate behind these figures is good to roughly a third of a metre, so
 * printing 10.99 m claims a precision the model does not have. Everything the
 * user sees is rounded to where the confidence actually stops.
 */
const Fmt = (function () {

  const FT = 3.28084;

  /* Working allowance is counted PER FREE END, because that is what it is for:
     enough string outside the frame to reach the gripper on the last pull of a
     bunch, and enough left to tie the knot. Generous on purpose -- a few spare
     centimetres cost nothing and coming up short ruins the set.

     How many free ends a job has is the whole difference between the methods.
     A two piece is two separate lengths, so four ends. A one piece is one
     length threaded from the middle, so two.

     Half a metre, not the 0.4 it was. An end has to reach the tension head on
     the last pull of its bunch AND leave enough to tie and hold a knot, and
     0.4 m is the point where a long frame and a clamp set back from the hoop
     start eating into the knot. Half a metre is the bench rule of thumb, it is
     the direction the guide's own advice points ("if you are unsure, err
     long"), and every frame in the catalogue still comes inside a standard
     12.2 m set by both methods -- which is the constraint that matters, since
     the guide's whole answer to "how much do I need" is "open a set". */
  /* 0.4 m now that the string round the outside of the frame is counted as
     string in the racket. It was 0.5 partly to make up for that missing
     length, and 0.4 is enough to reach the tension head and tie a knot. */
  const END_M = 0.4;

  const round1 = m => Math.round(m * 10) / 10;
  const up1 = m => Math.ceil(m * 10) / 10;          // always round a cut UP
  const ends = onePiece => (onePiece ? 2 : 4);

  /* What to measure off the reel: what the bed takes, plus an end's worth of
     working length for every free end the method leaves you with. */
  /* A one piece is never cut shorter than 37 ft (11.3 m): running out at the
     last cross means starting again, and a little spare costs nothing. */
  const ONE_MIN_M = 11.3;
  const cutTotal = (m, onePiece) => {
    const c = up1(m + END_M * ends(onePiece));
    return onePiece ? Math.min(SET_M, Math.max(ONE_MIN_M, c)) : c;
  };
  const cutLength = m => cutTotal(m, false);        // kept for the summary card

  /* The two sides of a one piece, summing exactly to that total. The short side
     carries half the mains; the long side carries the other half plus every
     cross, so it is much the longer of the two -- never a 50/50 cut. */
  function splitOne(mainM, crossM) {
    const total = cutTotal(mainM + crossM, true);
    const short = round1(mainM / 2 + END_M);
    return { short: short, long: round1(total - short), total: total };
  }

  /* A standard packaged set. Sets are this length precisely so that they string
     a conventional adult frame, which is why the guide checks against it rather
     than sending a beginner to buy a reel. */
  const SET_M = 12.2;

  /* "11.0 m (36 ft)": both units, one decimal in metric, none in imperial */
  /* Every length the app shows is in this one form. Under a foot and a half
     the imperial half is given in inches, so a short leftover is not "0 ft". */
  const metres = m => {
    const ft = m * FT;
    return `${round1(m).toFixed(1)} m (${ft < 1.5 ? Math.round(ft * 12) + ' in' : Math.round(ft) + ' ft'})`;
  };
  const metresOnly = m => `${round1(m).toFixed(1)} m`;
  const feet = m => `${Math.round(m * FT)} ft`;

  /* Two pieces, each sized for the plane it actually has to fill, and each
     carrying its own two ends. Splitting a shared total in proportion was the
     wrong shape: the two bunches are independent lengths, and which of them is
     longer is not fixed -- an 18x20 needs more in the mains, a 16x20 more in
     the crosses. Sizing each from its own plane gets that right by itself. */
  /* The mains piece gets longer tails than the crosses. The center pair is
     pulled through the whole length before anything is clamped, and both ends
     work outward, so the mains need more slack to reach the tension head. That
     is why stringers cut the mains piece longer: about 20 ft and 17 to 18 ft on
     a 16x19, which is the 37 to 38 ft most of them work to. */
  const END_MAIN = 0.45, END_CROSS = 0.3;
  function cutPair(mainM, crossM) {
    let mains = up1(mainM + 2 * END_MAIN);
    let crosses = up1(crossM + 2 * END_CROSS);
    let trimmed = false;
    /* A standard 40 ft set strings every frame on two piece, so the two pieces
       never add up to more than one. A dense frame is brought back inside it
       in proportion, which keeps the mains the longer piece. */
    if (mains + crosses > SET_M) {
      const k = SET_M / (mains + crosses);
      mains = Math.floor(mains * k * 10) / 10;
      crosses = Math.floor(crosses * k * 10) / 10;
      trimmed = true;
    }
    return { mains: mains, crosses: crosses, total: round1(mains + crosses), trimmed: trimmed };
  }
  /* The one number to cut: the whole length on one piece, the two pieces added
     up on two piece, so the total never disagrees with the pieces. */
  const cutFor = (stats, onePiece) => (onePiece ? cutTotal(stats.totalM, true)
                                                 : cutPair(stats.mainM, stats.crossM).total);
  /* True when the full allowance would not fit in one set, so the cut was
     brought back inside 12.2 m. The guide says so wherever it gives the cut. */
  const cutTrimmed = (stats, onePiece) => (onePiece
    ? up1(stats.totalM + END_M * ends(true)) > SET_M
    : cutPair(stats.mainM, stats.crossM).trimmed);

  /* The LOCAL calendar date. toISOString() is UTC, so an evening job in the
     Americas was logged as tomorrow. */
  /* Written the US way, "Oct 5, 2026", so nobody has to guess which number
     is the month. */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function today(d) {
    const t = d || new Date();
    return `${MONTHS[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`;
  }

  /* the article follows how the number is SAID: eighteen opens with a vowel */
  const article = w => (/^(8|11|18)/.test(String(w)) ? 'an' : 'a');
  const Article = w => (article(w) === 'an' ? 'An' : 'A');

  return { FT, END_M, END_MAIN, END_CROSS, SET_M, ONE_MIN_M, round1, up1, cutLength, cutTotal, cutPair, cutFor, cutTrimmed, splitOne, today,
           metres, metresOnly, feet, article, Article };
})();
