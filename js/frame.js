/* The frame in the user's hands.
 *
 * There is no racket list. Frame specs change between generations, regions
 * and Team or Lite versions, so the only reliable source is the racket itself.
 * Three things on it change the instructions, and the user reads all three
 * off the frame:
 *
 *   pattern      mains x crosses, printed on the frame ('16x19')
 *   throatPairs  sets of main holes just above the throat: 3 = the mains
 *                start at the throat, 4 = they start at the head
 *   headSize     square inches. Optional, and only the drawing and the string
 *                length follow it. Not sure means a typical 98.
 *
 * makeFrame() turns those into the object the rest of the app reads
 * (geometry.js, racketSvg.js, steps.js, throat.js): a generic hoop from a
 * typical 98 sq in frame, scaled to the head size, in one neutral colourway.
 * geometry.js scales the superellipse to enclose exactly headSize, so the
 * drawing and every number measured off it agree.
 */

/* Every pattern here is laid out by Geo.buildStringbed and routed by
   Steps.plan for any mains and crosses count: the plan works the ends out
   from the parity of mains per side and of the crosses, and test/run.js
   sweeps all of them. Listed 16 mains first, then 18, so they sit in two
   rows of three on the Your racket tab. */
const FRAME_PATTERNS = ['16x18', '16x19', '16x20', '18x16', '18x19', '18x20'];
const HEAD_SIZES = [95, 97, 98, 99, 100, 102, 104, 105, 107, 108, 110];
const DEFAULT_HEAD = 98;
const DEFAULT_FRAME = { pattern: '16x19', throatPairs: 3, headSize: null };

/* A frame with no brand: graphite, with the instruction colour already picked
   to clear it (the red marker reads on every grey). */
const NEUTRAL_THEME = {
  frameA: '#363c45', frameB: '#6c7784', frameEdge: '#14171b',
  accent: '#9aa6b4', accent2: '#e3e8ee',
  grip: '#181b20', butt: '#9aa6b4', bg1: '#0b0e12', bg2: '#161b22',
  string: '#e9e6dd',
  paintAccent: '#7f8894', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3'
};

/* "16x19 · 3 sets", the way the summary names a frame */
const frameLabel = f => `${f.pattern} · ${f.throatPairs} sets`;
const mainsStartOf = throatPairs => (throatPairs === 4 ? 'head' : 'throat');

function makeFrame(o) {
  const p = o || {};
  const pattern = FRAME_PATTERNS.indexOf(p.pattern) >= 0 ? p.pattern : DEFAULT_FRAME.pattern;
  const throatPairs = p.throatPairs === 4 ? 4 : 3;
  const headSize = HEAD_SIZES.indexOf(p.headSize) >= 0 ? p.headSize : DEFAULT_HEAD;
  // a typical 98: 248 x 318 mm inside the hoop. Scaled by the square root of
  // the area, so the shape stays the same and only the size moves.
  const k = Math.sqrt(headSize / 98);
  return {
    pattern: pattern, throatPairs: throatPairs, headSize: headSize,
    headWidth: 248 * k, headLength: 318 * k, shapeN: 2.38, headBias: 0.52,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845,
    beamMm: 22,
    theme: NEUTRAL_THEME
  };
}
