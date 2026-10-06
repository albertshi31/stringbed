/* Racket models, for the LOOK of the drawing only.
 *
 * Picking a model paints the drawing in that line's colors and gives the hoop
 * that line's shape: its width to length proportions and how square it is
 * (the Yonex frames are isometric, wide, short and square). Nothing else.
 * It never sets the pattern, the hole sets or the head size: those change
 * between generations of the same model, which is why the frame is read off
 * the racket in your hands instead of looked up here. The head size the user
 * gives still sets how big the hoop is. Models are named without a
 * generation, version or head size, so one entry covers a whole line that
 * shares a paint job.
 *
 * The themes and shapes are the ones the old racket list carried. `shape`
 * is that frame's inner hoop in millimeters, at the head size `at` it was
 * measured for, with its superellipse exponent and the share of the length
 * above the widest point.
 */
const RACKET_MODELS = [
  { id: 'pure-aero', brand: 'Babolat', name: 'Pure Aero',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.39, headBias: 0.52 },
    theme: { frameA: '#141414', frameB: '#3a3a34', frameEdge: '#000000', accent: '#f5e02a', accent2: '#fff7a8', grip: '#141414', butt: '#f5e02a', paintAccent: '#cea724', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'pure-drive', brand: 'Babolat', name: 'Pure Drive',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.35, headBias: 0.52 },
    theme: { frameA: '#0b2f8f', frameB: '#2f7bff', frameEdge: '#06184d', accent: '#2f7bff', accent2: '#bcd6ff', grip: '#0a1020', butt: '#ffffff', paintAccent: '#4868ae', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'pure-strike', brand: 'Babolat', name: 'Pure Strike',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.35, headBias: 0.52 },
    theme: { frameA: '#8f9198', frameB: '#d8d9dd', frameEdge: '#2d2f35', accent: '#d61f26', accent2: '#1c1f24', grip: '#16181c', butt: '#d61f26', paintAccent: '#ac6159', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'cx', brand: 'Dunlop', name: 'CX',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.38, headBias: 0.52 },
    theme: { frameA: '#111318', frameB: '#8a1220', frameEdge: '#07080b', accent: '#e0203a', accent2: '#ffc3cb', grip: '#111318', butt: '#e0203a', paintAccent: '#a7332e', instructionAccent: '#f2f5f9', instructionInk: '#fbfcfd' } },
  { id: 'fx', brand: 'Dunlop', name: 'FX',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#081a2e', frameB: '#1f7ec4', frameEdge: '#040f1c', accent: '#28a4e0', accent2: '#c4e9ff', grip: '#081018', butt: '#28a4e0', paintAccent: '#447a8b', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'sx', brand: 'Dunlop', name: 'SX',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#1a1a12', frameB: '#c9d426', frameEdge: '#0b0b06', accent: '#dbe22f', accent2: '#f6ffb8', grip: '#14140f', butt: '#dbe22f', paintAccent: '#c1a025', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'boom', brand: 'HEAD', name: 'Boom',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#0a1f1e', frameB: '#138a80', frameEdge: '#041110', accent: '#2fd1c0', accent2: '#c8f7f1', grip: '#0a1414', butt: '#2fd1c0', paintAccent: '#479377', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'extreme', brand: 'HEAD', name: 'Extreme',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.38, headBias: 0.52 },
    theme: { frameA: '#14200c', frameB: '#6ca82a', frameEdge: '#0a1206', accent: '#96d02f', accent2: '#e4ffbc', grip: '#101609', butt: '#96d02f', paintAccent: '#aa9326', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'gravity', brand: 'HEAD', name: 'Gravity',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.39, headBias: 0.52 },
    theme: { frameA: '#0c1c22', frameB: '#1b6f7d', frameEdge: '#061014', accent: '#2fb3c4', accent2: '#cdf1f6', grip: '#0b1418', butt: '#2fb3c4', paintAccent: '#48827a', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'prestige', brand: 'HEAD', name: 'Prestige',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.41, headBias: 0.52 },
    theme: { frameA: '#12100f', frameB: '#6e0f1c', frameEdge: '#080606', accent: '#c8a24a', accent2: '#f4e3b4', grip: '#12100f', butt: '#c8a24a', paintAccent: '#b39437', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'radical', brand: 'HEAD', name: 'Radical',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.38, headBias: 0.52 },
    theme: { frameA: '#111111', frameB: '#f26722', frameEdge: '#0a0a0a', accent: '#f26722', accent2: '#ffd9c0', grip: '#101010', butt: '#f26722', paintAccent: '#b15821', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'speed', brand: 'HEAD', name: 'Speed',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#e6e8eb', frameB: '#f7f8f9', frameEdge: '#2a2d33', accent: '#111317', accent2: '#8d949e', grip: '#111317', butt: '#111317', paintAccent: '#948e7d', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'speed-pro', brand: 'HEAD', name: 'Speed Pro',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#0e0e10', frameB: '#5b6470', frameEdge: '#000000', accent: '#e8ecf2', accent2: '#8fa2b8', grip: '#0e0e10', butt: '#e8ecf2', paintAccent: '#94896b', instructionAccent: '#e8ecf2', instructionInk: '#f7f9fb' } },
  { id: 'classic-graphite', brand: 'Prince', name: 'Classic Graphite',
    shape: { width: 259, length: 333, at: 107, shapeN: 2.33, headBias: 0.52 },
    theme: { frameA: '#141414', frameB: '#3d3d3d', frameEdge: '#050505', accent: '#38b6ff', accent2: '#c9ecff', grip: '#141414', butt: '#38b6ff', paintAccent: '#4f8297', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'phantom', brand: 'Prince', name: 'Phantom',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.35, headBias: 0.52 },
    theme: { frameA: '#8d949d', frameB: '#d4d8dd', frameEdge: '#2f343b', accent: '#1b1d21', accent2: '#6b7280', grip: '#1b1d21', butt: '#1b1d21', paintAccent: '#706c5d', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'blackout', brand: 'Solinco', name: 'Blackout',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#0b0b0c', frameB: '#232427', frameEdge: '#000000', accent: '#9aa1ab', accent2: '#e6e9ee', grip: '#0b0b0c', butt: '#9aa1ab', paintAccent: '#8e8671', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'whiteout', brand: 'Solinco', name: 'Whiteout',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#919aa3', frameB: '#dadde1', frameEdge: '#31363d', accent: '#20242b', accent2: '#79828f', grip: '#1a1d22', butt: '#20242b', paintAccent: '#737164', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'tf40', brand: 'Tecnifibre', name: 'TF40',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.38, headBias: 0.52 },
    theme: { frameA: '#8892a1', frameB: '#d3dae3', frameEdge: '#2a313b', accent: '#12325f', accent2: '#7f8b9c', grip: '#15181c', butt: '#12325f', paintAccent: '#626872', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'tfight', brand: 'Tecnifibre', name: 'TFight',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#8b939e', frameB: '#d6dbe1', frameEdge: '#2c323a', accent: '#d81f28', accent2: '#7d8794', grip: '#17191d', butt: '#d81f28', paintAccent: '#ab615d', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'blade', brand: 'Wilson', name: 'Blade',
    shape: { width: 248, length: 318, at: 98, shapeN: 2.38, headBias: 0.52 },
    theme: { frameA: '#0b3b2e', frameB: '#1f8f63', frameEdge: '#04211a', accent: '#39e08a', accent2: '#d9fbe9', grip: '#0c1512', butt: '#39e08a', paintAccent: '#4da05d', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'clash', brand: 'Wilson', name: 'Clash',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.35, headBias: 0.52 },
    theme: { frameA: '#14100f', frameB: '#b3151c', frameEdge: '#080505', accent: '#e0242b', accent2: '#ffc9c6', grip: '#14100f', butt: '#e0242b', paintAccent: '#a83425', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'pro-staff', brand: 'Wilson', name: 'Pro Staff',
    shape: { width: 247, length: 317, at: 97, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#2a1a10', frameB: '#6b4425', frameEdge: '#150c06', accent: '#a9702f', accent2: '#f0dcc2', grip: '#1a120c', butt: '#a9702f', paintAccent: '#a68426', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } },
  { id: 'shift', brand: 'Wilson', name: 'Shift',
    shape: { width: 250, length: 320, at: 99, shapeN: 2.37, headBias: 0.52 },
    theme: { frameA: '#d9d5e6', frameB: '#f2f0f8', frameEdge: '#4a4460', accent: '#7b5cc4', accent2: '#e3dbf7', grip: '#1c1a24', butt: '#7b5cc4', paintAccent: '#ac94b6', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'ultra', brand: 'Wilson', name: 'Ultra',
    shape: { width: 251, length: 322, at: 100, shapeN: 2.36, headBias: 0.52 },
    theme: { frameA: '#0b1f4d', frameB: '#2f6fd6', frameEdge: '#05122c', accent: '#3f8ae0', accent2: '#c6ddff', grip: '#0a1020', butt: '#3f8ae0', paintAccent: '#506d91', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'ezone', brand: 'Yonex', name: 'EZONE',
    shape: { width: 249, length: 300, at: 98, shapeN: 2.63, headBias: 0.52 },
    theme: { frameA: '#00306b', frameB: '#0f9bd8', frameEdge: '#001a3d', accent: '#19c3f2', accent2: '#bff0ff', grip: '#08131f', butt: '#19c3f2', paintAccent: '#3a8fa0', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'percept', brand: 'Yonex', name: 'Percept',
    shape: { width: 247, length: 299, at: 97, shapeN: 2.6, headBias: 0.52 },
    theme: { frameA: '#1f2616', frameB: '#5d6b3a', frameEdge: '#0e1209', accent: '#a3b35e', accent2: '#e6edc8', grip: '#151a0f', butt: '#a3b35e', paintAccent: '#9f8c45', instructionAccent: '#ff4d4f', instructionInk: '#ffc2c3' } },
  { id: 'vcore', brand: 'Yonex', name: 'VCORE',
    shape: { width: 246, length: 296, at: 95, shapeN: 2.6, headBias: 0.52 },
    theme: { frameA: '#3d0d0d', frameB: '#c4171c', frameEdge: '#1c0505', accent: '#e02b22', accent2: '#ffc9c2', grip: '#150a0a', butt: '#e02b22', paintAccent: '#b03720', instructionAccent: '#3ddcff', instructionInk: '#bdf3ff' } }

];

/* Old saves named a racket from the list. This maps each of those ids to the
   model that has its colors, so an old job comes back in the same paint. */
const OLD_RACKET_MODEL = {
  pureaero: 'pure-aero', pureaero100: 'pure-aero', puredrive: 'pure-drive',
  puredrive107: 'pure-drive', purestrike: 'pure-strike', purestrike100: 'pure-strike',
  cx200: 'cx', fx500: 'fx', sx300: 'sx', boommp: 'boom', boompro: 'boom', extreme: 'extreme',
  extremepro: 'extreme', gravity: 'gravity', gravitypro: 'gravity', prestige: 'prestige',
  prestigemp: 'prestige', radicalmp: 'radical', radicalpro: 'radical', speedmp: 'speed',
  speedpro: 'speed-pro', pog107: 'classic-graphite', phantom100p: 'phantom',
  blackout300: 'blackout', whiteout: 'whiteout', tf40: 'tf40', tf40s: 'tf40',
  tfight305: 'tfight', tfight300: 'tfight', blade98: 'blade', blade98s: 'blade',
  blade100l: 'blade', blade104: 'blade', clash100: 'clash', clash98: 'clash',
  clash100pro: 'clash', clash108: 'clash', ps97: 'pro-staff', ps97l: 'pro-staff',
  shift99: 'shift', shift99pro: 'shift', ultra100: 'ultra', ultra100ul: 'ultra',
  ezone98: 'ezone', ezone100: 'ezone', percept97: 'percept', percept100: 'percept',
  vcore95: 'vcore', vcore98: 'vcore', vcore100: 'vcore'
};

const modelById = id => RACKET_MODELS.find(m => m.id === id) || null;
/* brands in the order they are listed, each once */
const MODEL_BRANDS = RACKET_MODELS.map(m => m.brand).filter((b, i, a) => a.indexOf(b) === i);
