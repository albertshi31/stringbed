/* String catalogue.
 *
 * `density` is the material's density in g/cm3 (polyester ~1.38, nylon
 * multifilaments ~1.14, natural gut ~1.32) — it turns the length of string in
 * the bed into the weight it adds to the frame.
 *
 * `colors` lists the colourways the string is actually sold in -- several
 * strings come in more than one, so the bed is drawn in whichever is picked
 * rather than in one assumed colour. `stiffness` is a rough relative index
 * (polys ~200-240, multis ~110-150, natural gut ~100) used for the feel
 * estimate. `gauge` is the nominal diameter in mm.
 */
const STRINGS = [
  { id: 'alu', name: 'Luxilon ALU Power', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 226,
    colors: [{ name: 'Silver', hex: '#c6cad0' }] },

  { id: 'alurough', name: 'Luxilon ALU Power Rough', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 228,
    colors: [{ name: 'Silver', hex: '#bfc4ca' }] },

  { id: '4g', name: 'Luxilon 4G', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 234,
    colors: [{ name: 'Gold', hex: '#c2a041' }] },

  { id: 'rpm', name: 'Babolat RPM Blast', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 218,
    colors: [{ name: 'Black', hex: '#17181a' }] },

  { id: 'gut', name: 'Babolat VS Natural Gut', type: 'Natural gut', density: 1.32, gauge: 1.30, stiffness: 104,
    colors: [{ name: 'Natural', hex: '#e2cfa6' }] },

  { id: 'hyperg', name: 'Solinco Hyper-G', type: 'Polyester', density: 1.38, gauge: 1.20, stiffness: 232,
    colors: [{ name: 'Green', hex: '#57b13f' }] },

  { id: 'tourbite', name: 'Solinco Tour Bite', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 240,
    colors: [{ name: 'Silver', hex: '#b6bac1' }] },

  { id: 'confidential', name: 'Solinco Confidential', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 210,
    colors: [{ name: 'Gunmetal grey', hex: '#6b7076' }] },

  { id: 'ptp', name: 'Yonex Poly Tour Pro', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 205,
    colors: [{ name: 'Blue', hex: '#2a6cc0' }, { name: 'Yellow', hex: '#dfcb34' },
             { name: 'Graphite', hex: '#4a4d52' }] },

  { id: 'blackcode', name: 'Tecnifibre Black Code', type: 'Polyester', density: 1.38, gauge: 1.24, stiffness: 221,
    colors: [{ name: 'Black', hex: '#121316' }] },

  { id: 'lynx', name: 'HEAD Lynx Tour', type: 'Polyester', density: 1.38, gauge: 1.25, stiffness: 214,
    colors: [{ name: 'Champagne', hex: '#c0a577' }, { name: 'Black', hex: '#1a1a1c' }] },

  { id: 'nxt', name: 'Wilson NXT', type: 'Multifilament', density: 1.14, gauge: 1.30, stiffness: 128,
    colors: [{ name: 'Natural', hex: '#ede7da' }] },

  { id: 'xone', name: 'Tecnifibre X-One Biphase', type: 'Multifilament', density: 1.14, gauge: 1.30, stiffness: 118,
    colors: [{ name: 'Natural', hex: '#f0ebde' }] },

  { id: 'nrg2', name: 'Tecnifibre NRG2', type: 'Multifilament', density: 1.14, gauge: 1.24, stiffness: 122,
    colors: [{ name: 'Natural', hex: '#eae3d3' }] },

  { id: 'velocity', name: 'HEAD Velocity MLT', type: 'Multifilament', density: 1.14, gauge: 1.30, stiffness: 126,
    colors: [{ name: 'Natural', hex: '#e8e0cf' }] },

  { id: 'syngut', name: 'Prince Synthetic Gut Duraflex', type: 'Synthetic gut', density: 1.14, gauge: 1.30, stiffness: 150,
    colors: [{ name: 'White', hex: '#f3f3f1' }, { name: 'Gold', hex: '#d3ae57' },
             { name: 'Black', hex: '#1c1c1e' }] }
];

/* first colourway is the default */
STRINGS.forEach(s => { s.color = s.colors[0].hex; });

const GAUGES = [1.15, 1.20, 1.25, 1.30, 1.35];

/* Patterns the simulator knows how to lay out. */
/* The patterns the app offers. Every racket's own stock pattern is one of
   these, so the dropdown never grows a fifth entry for a particular frame. */
const PATTERNS = ['16x19', '16x20', '18x19', '18x20'];
