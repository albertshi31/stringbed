/* String catalogue: one generic entry per KIND of string.
 *
 * The app does not ask for a brand or model. What changes how a job is strung
 * and how it plays is the kind of string, its thickness and the tension, so
 * each kind carries typical values for itself.
 *
 * `density` is the material's density in g/cm3 (polyester ~1.38, nylon
 * ~1.14, natural gut ~1.32). It turns the length of string in the bed into the
 * weight it adds to the frame. `stiffness` is a rough relative index used for
 * the feel estimate: the polyester and multifilament figures are the averages
 * of common strings of that kind. `gauge` is the usual thickness in mm, and
 * `colors` holds the one colour the bed is drawn in.
 */
const STRINGS = [
  { id: 'syngut', name: 'Synthetic gut', type: 'Synthetic gut', density: 1.14, gauge: 1.30, stiffness: 150,
    colors: [{ name: 'Off white', hex: '#e9e6dd' }] },

  { id: 'multi', name: 'Multifilament', type: 'Multifilament', density: 1.14, gauge: 1.30, stiffness: 124,
    colors: [{ name: 'Ivory', hex: '#ece5d4' }] },

  { id: 'poly', name: 'Polyester', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 223,
    colors: [{ name: 'Silver', hex: '#c6cad0' }] },

  { id: 'gut', name: 'Natural gut', type: 'Natural gut', density: 1.32, gauge: 1.30, stiffness: 104,
    colors: [{ name: 'Natural', hex: '#e2cfa6' }] }
];

/* the drawing colour */
STRINGS.forEach(s => { s.color = s.colors[0].hex; });

const GAUGES = [1.15, 1.20, 1.25, 1.30, 1.35];
