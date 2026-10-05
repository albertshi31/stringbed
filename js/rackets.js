/* Racket catalogue.
 *
 * `tension` is the manufacturer's own recommended range in lb -- the numbers
 * printed on the frame, not a playing preference. Most brands print one range
 * across a whole line, so line-mates share it; where a model is specced on its
 * own (Dunlop FX 500, Prince Classic Graphite) it carries its own. The frame
 * itself is the authority: these are for orientation, like the tie-off holes.
 * Geometry is in millimetres, measured on the INNER edge of the hoop
 * (the stringbed opening).  `shapeN` is the exponent of the superellipse
 * used for the hoop: 2.0 = pure ellipse, higher = squarer / "isometric".
 *
 * `headSize` is the authority on how big the hoop is: geometry.js scales the
 * superellipse to enclose exactly that area, so the drawn frame and every
 * number measured off it agree with the figure printed here.
 *
 * `weightG` and `balanceMm` are recorded for completeness; nothing reads them
 * yet.
 *
 * To add a racket, copy a block and change the numbers. Nothing else needs
 * to know about it -- the UI is generated from this list.
 */
const RACKETS = [
  {
    id: 'ps97',
    beamMm: 21.5,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Pro Staff 97 v14',
    pattern: '16x19',
    headSize: 97,
    headWidth: 247, headLength: 317, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 315, balanceMm: 315,
    tension: [50, 60],
    theme: {
      frameA: '#2a1a10', frameB: '#6b4425', frameEdge: '#150c06',
      accent: '#a9702f', accent2: '#f0dcc2',
      grip: '#1a120c', butt: '#a9702f', bg1: '#140d08', bg2: '#2b1c11',
      string: '#e9e6dd'
    }
  },
  {
    id: 'blade98',
    beamMm: 21.0,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Blade 98 v9',
    pattern: '18x20',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 320,
    tension: [50, 60],
    theme: {
      frameA: '#0b3b2e', frameB: '#1f8f63', frameEdge: '#04211a',
      accent: '#39e08a', accent2: '#d9fbe9',
      grip: '#0c1512', butt: '#39e08a', bg1: '#08150f', bg2: '#0f2b20',
      string: '#f2f2f2'
    }
  },
  {
    id: 'puredrive',
    beamMm: 23.0,
    throatPairs: 3,
    brand: 'Babolat',
    model: 'Pure Drive 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.35,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [50, 59],
    theme: {
      frameA: '#0b2f8f', frameB: '#2f7bff', frameEdge: '#06184d',
      accent: '#2f7bff', accent2: '#bcd6ff',
      grip: '#0a1020', butt: '#ffffff', bg1: '#071026', bg2: '#0e2350',
      string: '#ffffff'
    }
  },
  {
    id: 'pureaero',
    beamMm: 23.0,
    throatPairs: 3,
    brand: 'Babolat',
    model: 'Pure Aero 98',
    pattern: '16x20',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.39,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [50, 59],
    theme: {
      frameA: '#141414', frameB: '#3a3a34', frameEdge: '#000000',
      accent: '#f5e02a', accent2: '#fff7a8',
      grip: '#141414', butt: '#f5e02a', bg1: '#12120c', bg2: '#26240f',
      string: '#111111'
    }
  },
  {
    id: 'radicalmp',
    beamMm: 22.0,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Radical MP',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [48, 57],
    theme: {
      frameA: '#111111', frameB: '#f26722', frameEdge: '#0a0a0a',
      accent: '#f26722', accent2: '#ffd9c0',
      grip: '#101010', butt: '#f26722', bg1: '#140d08', bg2: '#2e1a0d',
      string: '#f0f0ee'
    }
  },
  {
    id: 'speedpro',
    beamMm: 23.0,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Speed Pro',
    pattern: '18x20',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 315,
    tension: [48, 57],
    theme: {
      frameA: '#0e0e10', frameB: '#5b6470', frameEdge: '#000000',
      accent: '#e8ecf2', accent2: '#8fa2b8',
      grip: '#0e0e10', butt: '#e8ecf2', bg1: '#0b0d10', bg2: '#1d2229',
      string: '#d8dde4'
    }
  },
  {
    id: 'ezone98',
    beamMm: 23.0,
    throatPairs: 3, // Yonex: start at throat, tie off 8T
    brand: 'Yonex',
    model: 'EZONE 98',
    pattern: '16x19',
    headSize: 98,
    headWidth: 249, headLength: 300, shapeN: 2.63, // isometric: wide, short, square
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [45, 60],
    theme: {
      frameA: '#00306b', frameB: '#0f9bd8', frameEdge: '#001a3d',
      accent: '#19c3f2', accent2: '#bff0ff',
      grip: '#08131f', butt: '#19c3f2', bg1: '#05101f', bg2: '#0a2b45',
      string: '#eaf6ff'
    }
  },
  {
    id: 'vcore95',
    beamMm: 21.0,
    throatPairs: 3,
    brand: 'Yonex',
    model: 'VCORE 95',
    pattern: '16x20',
    headSize: 95,
    // Isometric: wide and short, and SQUARER than a conventional hoop. A
    // squarer shape encloses more area for the same width x length, so the
    // dimensions are sized down to match the 95 in2 this frame actually is --
    // carrying a conventional frame's width here drew it as a 100.
    headWidth: 246, headLength: 296, shapeN: 2.60,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 310,
    tension: [45, 60],
    theme: {
      frameA: '#3d0d0d', frameB: '#c4171c', frameEdge: '#1c0505',
      accent: '#e02b22', accent2: '#ffc9c2',
      grip: '#150a0a', butt: '#e02b22', bg1: '#150809', bg2: '#331113',
      string: '#fff0ee'
    }
  },
  {
    id: 'phantom100p',
    beamMm: 18.5,
    throatPairs: 4,
    brand: 'Prince',
    model: 'Phantom 100P',
    pattern: '18x20',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.35,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [50, 60],
    theme: {
      frameA: '#8d949d', frameB: '#d4d8dd', frameEdge: '#2f343b',
      accent: '#1b1d21', accent2: '#6b7280',
      grip: '#1b1d21', butt: '#1b1d21', bg1: '#171a1e', bg2: '#2b3038',
      string: '#2a2c30'
    }
  },
  {
    id: 'tf40',
    beamMm: 21.5,
    throatPairs: 4,
    brand: 'Tecnifibre',
    model: 'TF40 305',
    pattern: '18x20',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [49, 55],
    theme: {
      frameA: '#8892a1', frameB: '#d3dae3', frameEdge: '#2a313b',
      accent: '#12325f', accent2: '#7f8b9c',
      grip: '#15181c', butt: '#12325f', bg1: '#121519', bg2: '#242a31',
      string: '#ffffff'
    }
  },
  {
    id: 'cx200',
    beamMm: 21.0,
    throatPairs: 3,
    brand: 'Dunlop',
    model: 'CX 200',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [45, 65],
    theme: {
      frameA: '#111318', frameB: '#8a1220', frameEdge: '#07080b',
      accent: '#e0203a', accent2: '#ffc3cb',
      grip: '#111318', butt: '#e0203a', bg1: '#120a0c', bg2: '#2b0f14',
      string: '#ededed'
    }
  },
  {
    id: 'blackout300',
    beamMm: 22.0,
    throatPairs: 3, // Solinco: mains tie off 8B, so they start at the throat
    brand: 'Solinco',
    model: 'Blackout 300 XTD',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 50],
    theme: {
      frameA: '#0b0b0c', frameB: '#232427', frameEdge: '#000000',
      accent: '#9aa1ab', accent2: '#e6e9ee',
      grip: '#0b0b0c', butt: '#9aa1ab', bg1: '#0a0b0d', bg2: '#191b1f',
      string: '#e8eaee'
    }
  },
  {
    id: 'prestige',
    beamMm: 20.0,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Prestige Pro',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.41,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 320, balanceMm: 310,
    tension: [48, 57],
    theme: {
      frameA: '#12100f', frameB: '#6e0f1c', frameEdge: '#080606',
      accent: '#c8a24a', accent2: '#f4e3b4',
      grip: '#12100f', butt: '#c8a24a', bg1: '#100c0a', bg2: '#2a1416',
      string: '#e8dcc4'
    }
  },
  {
    id: 'clash100',
    beamMm: 24.5,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Clash 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.35,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 295, balanceMm: 320,
    tension: [50, 60],
    theme: {
      frameA: '#14100f', frameB: '#b3151c', frameEdge: '#080505',
      accent: '#e0242b', accent2: '#ffc9c6',
      grip: '#14100f', butt: '#e0242b', bg1: '#130a0a', bg2: '#2c1010',
      string: '#f5f5f5'
    }
  },
  {
    id: 'pog107',
    beamMm: 22.0,
    throatPairs: 3,
    brand: 'Prince',
    model: 'Classic Graphite 107',
    pattern: '16x19',
    headSize: 107,
    headWidth: 259, headLength: 333, shapeN: 2.33,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 320, balanceMm: 305,
    tension: [55, 65],
    theme: {
      frameA: '#141414', frameB: '#3d3d3d', frameEdge: '#050505',
      accent: '#38b6ff', accent2: '#c9ecff',
      grip: '#141414', butt: '#38b6ff', bg1: '#0c1014', bg2: '#1a2630',
      string: '#efefef'
    }
  },
  {
    id: 'ultra100',
    throatPairs: 3,
    beamMm: 26.5,
    brand: 'Wilson',
    model: 'Ultra 100 v4',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [50, 60],
    theme: {
      frameA: '#0b1f4d', frameB: '#2f6fd6', frameEdge: '#05122c',
      accent: '#3f8ae0', accent2: '#c6ddff',
      grip: '#0a1020', butt: '#3f8ae0', bg1: '#08101f', bg2: '#122844',
      string: '#eef4ff'
    }
  },
  {
    id: 'purestrike',
    throatPairs: 4,
    beamMm: 21.0,
    brand: 'Babolat',
    model: 'Pure Strike 98',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.35,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [50, 59],
    theme: {
      frameA: '#8f9198', frameB: '#d8d9dd', frameEdge: '#2d2f35',
      accent: '#d61f26', accent2: '#1c1f24',
      grip: '#16181c', butt: '#d61f26', bg1: '#131519', bg2: '#262a30',
      string: '#1a1c20'
    }
  },
  {
    id: 'gravity',
    throatPairs: 3,
    beamMm: 22.0,
    brand: 'HEAD',
    model: 'Gravity MP',
    pattern: '16x20',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.39,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 295, balanceMm: 320,
    tension: [48, 57],
    theme: {
      frameA: '#0c1c22', frameB: '#1b6f7d', frameEdge: '#061014',
      accent: '#2fb3c4', accent2: '#cdf1f6',
      grip: '#0b1418', butt: '#2fb3c4', bg1: '#081215', bg2: '#0f2a30',
      string: '#eaf9fb'
    }
  },
  {
    id: 'extreme',
    throatPairs: 3,
    beamMm: 23.0,
    brand: 'HEAD',
    model: 'Extreme MP',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 325,
    tension: [48, 57],
    theme: {
      frameA: '#14200c', frameB: '#6ca82a', frameEdge: '#0a1206',
      accent: '#96d02f', accent2: '#e4ffbc',
      grip: '#101609', butt: '#96d02f', bg1: '#0d1408', bg2: '#1e2d10',
      string: '#f3ffdf'
    }
  },
  {
    id: 'tfight305',
    throatPairs: 4,
    beamMm: 21.5,
    brand: 'Tecnifibre',
    model: 'TFight 305 ISO',
    pattern: '18x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [49, 55],
    theme: {
      frameA: '#8b939e', frameB: '#d6dbe1', frameEdge: '#2c323a',
      accent: '#d81f28', accent2: '#7d8794',
      grip: '#17191d', butt: '#d81f28', bg1: '#131519', bg2: '#262a31',
      string: '#1d2025'
    }
  },
  {
    id: 'whiteout',
    throatPairs: 4,
    beamMm: 20.0,
    brand: 'Solinco',
    model: 'Whiteout 305',
    pattern: '18x20',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [45, 50],
    theme: {
      frameA: '#919aa3', frameB: '#dadde1', frameEdge: '#31363d',
      accent: '#20242b', accent2: '#79828f',
      grip: '#1a1d22', butt: '#20242b', bg1: '#14171b', bg2: '#272c33',
      string: '#23262c'
    }
  },
  {
    id: 'fx500',
    throatPairs: 3,
    beamMm: 23.0,
    brand: 'Dunlop',
    model: 'FX 500',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 65],
    theme: {
      frameA: '#081a2e', frameB: '#1f7ec4', frameEdge: '#040f1c',
      accent: '#28a4e0', accent2: '#c4e9ff',
      grip: '#081018', butt: '#28a4e0', bg1: '#071019', bg2: '#0f2740',
      string: '#eaf6ff'
    }
  },
  {
    id: 'sx300',
    throatPairs: 3,
    beamMm: 23.0,
    brand: 'Dunlop',
    model: 'SX 300',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 65],
    theme: {
      frameA: '#1a1a12', frameB: '#c9d426', frameEdge: '#0b0b06',
      accent: '#dbe22f', accent2: '#f6ffb8',
      grip: '#14140f', butt: '#dbe22f', bg1: '#121208', bg2: '#26280f',
      string: '#1c1d16'
    }
  },
  {
    id: 'ps97l',
    beamMm: 21.5,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Pro Staff 97L v14',
    pattern: '16x19',
    headSize: 97,
    headWidth: 247, headLength: 317, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 290, balanceMm: 325,
    tension: [50, 60],
    theme: {
      frameA: '#2a1a10', frameB: '#6b4425', frameEdge: '#150c06',
      accent: '#a9702f', accent2: '#f0dcc2',
      grip: '#1a120c', butt: '#a9702f', bg1: '#140d08', bg2: '#2b1c11',
      string: '#e9e6dd'
    }
  },
  {
    id: 'blade98s',
    beamMm: 21.0,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Blade 98 v9',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 320,
    tension: [50, 60],
    theme: {
      frameA: '#0b3b2e', frameB: '#1f8f63', frameEdge: '#04211a',
      accent: '#39e08a', accent2: '#d9fbe9',
      grip: '#0c1512', butt: '#39e08a', bg1: '#08150f', bg2: '#0f2b20',
      string: '#f2f2f2'
    }
  },
  {
    id: 'blade100l',
    beamMm: 22.0,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Blade 100L v9',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 285, balanceMm: 325,
    tension: [50, 60],
    theme: {
      frameA: '#0b3b2e', frameB: '#1f8f63', frameEdge: '#04211a',
      accent: '#39e08a', accent2: '#d9fbe9',
      grip: '#0c1512', butt: '#39e08a', bg1: '#08150f', bg2: '#0f2b20',
      string: '#f2f2f2'
    }
  },
  {
    id: 'blade104',
    beamMm: 22.5,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Blade 104 v9',
    pattern: '16x19',
    headSize: 104,
    headWidth: 256, headLength: 328, shapeN: 2.35,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 290, balanceMm: 330,
    tension: [50, 60],
    theme: {
      frameA: '#0b3b2e', frameB: '#1f8f63', frameEdge: '#04211a',
      accent: '#39e08a', accent2: '#d9fbe9',
      grip: '#0c1512', butt: '#39e08a', bg1: '#08150f', bg2: '#0f2b20',
      string: '#f2f2f2'
    }
  },
  {
    id: 'clash98',
    beamMm: 24.0,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Clash 98 v2',
    pattern: '16x20',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 315,
    tension: [50, 60],
    theme: {
      frameA: '#14100f', frameB: '#b3151c', frameEdge: '#080505',
      accent: '#e0242b', accent2: '#ffc9c6',
      grip: '#14100f', butt: '#e0242b', bg1: '#130a0a', bg2: '#2c1010',
      string: '#f5f5f5'
    }
  },
  {
    id: 'clash100pro',
    beamMm: 24.0,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Clash 100 Pro v3',
    pattern: '16x20',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 315,
    tension: [50, 60],
    theme: {
      frameA: '#14100f', frameB: '#b3151c', frameEdge: '#080505',
      accent: '#e0242b', accent2: '#ffc9c6',
      grip: '#14100f', butt: '#e0242b', bg1: '#130a0a', bg2: '#2c1010',
      string: '#f5f5f5'
    }
  },
  {
    id: 'clash108',
    beamMm: 24.5,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Clash 108 v3',
    pattern: '16x19',
    headSize: 108,
    headWidth: 260, headLength: 334, shapeN: 2.33,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 280, balanceMm: 340,
    tension: [50, 60],
    theme: {
      frameA: '#14100f', frameB: '#b3151c', frameEdge: '#080505',
      accent: '#e0242b', accent2: '#ffc9c6',
      grip: '#14100f', butt: '#e0242b', bg1: '#130a0a', bg2: '#2c1010',
      string: '#f5f5f5'
    }
  },
  {
    id: 'shift99',
    beamMm: 23.0,
    throatPairs: 4,
    brand: 'Wilson',
    model: 'Shift 99 v1',
    pattern: '16x20',
    headSize: 99,
    headWidth: 250, headLength: 320, shapeN: 2.37,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [50, 60],
    theme: {
      frameA: '#d9d5e6', frameB: '#f2f0f8', frameEdge: '#4a4460',
      accent: '#7b5cc4', accent2: '#e3dbf7',
      grip: '#1c1a24', butt: '#7b5cc4', bg1: '#121019', bg2: '#26213a',
      string: '#2a2733'
    }
  },
  {
    id: 'shift99pro',
    beamMm: 23.0,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Shift 99 Pro v1',
    pattern: '18x20',
    headSize: 99,
    headWidth: 250, headLength: 320, shapeN: 2.37,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 315, balanceMm: 315,
    tension: [50, 60],
    theme: {
      frameA: '#d9d5e6', frameB: '#f2f0f8', frameEdge: '#4a4460',
      accent: '#7b5cc4', accent2: '#e3dbf7',
      grip: '#1c1a24', butt: '#7b5cc4', bg1: '#121019', bg2: '#26213a',
      string: '#2a2733'
    }
  },
  {
    id: 'ultra100ul',
    beamMm: 26.5,
    throatPairs: 3,
    brand: 'Wilson',
    model: 'Ultra 100UL v4',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 277, balanceMm: 335,
    tension: [50, 60],
    theme: {
      frameA: '#0b1f4d', frameB: '#2f6fd6', frameEdge: '#05122c',
      accent: '#3f8ae0', accent2: '#c6ddff',
      grip: '#0a1020', butt: '#3f8ae0', bg1: '#08101f', bg2: '#122844',
      string: '#eef4ff'
    }
  },
  {
    id: 'speedmp',
    beamMm: 23.0,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Speed MP',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [48, 57],
    theme: {
      frameA: '#e6e8eb', frameB: '#f7f8f9', frameEdge: '#2a2d33',
      accent: '#111317', accent2: '#8d949e',
      grip: '#111317', butt: '#111317', bg1: '#0e1013', bg2: '#23272d',
      string: '#1b1d21'
    }
  },
  {
    id: 'boommp',
    beamMm: 24.0,
    throatPairs: 3,
    brand: 'HEAD',
    model: 'Boom MP',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 295, balanceMm: 325,
    tension: [48, 57],
    theme: {
      frameA: '#0a1f1e', frameB: '#138a80', frameEdge: '#041110',
      accent: '#2fd1c0', accent2: '#c8f7f1',
      grip: '#0a1414', butt: '#2fd1c0', bg1: '#071312', bg2: '#0e2b29',
      string: '#effcfa'
    }
  },
  {
    id: 'boompro',
    beamMm: 22.0,
    throatPairs: 3,
    brand: 'HEAD',
    model: 'Boom Pro',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 315,
    tension: [48, 57],
    theme: {
      frameA: '#0a1f1e', frameB: '#138a80', frameEdge: '#041110',
      accent: '#2fd1c0', accent2: '#c8f7f1',
      grip: '#0a1414', butt: '#2fd1c0', bg1: '#071312', bg2: '#0e2b29',
      string: '#effcfa'
    }
  },
  {
    id: 'radicalpro',
    beamMm: 21.5,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Radical Pro',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 315, balanceMm: 315,
    tension: [48, 57],
    theme: {
      frameA: '#111111', frameB: '#f26722', frameEdge: '#0a0a0a',
      accent: '#f26722', accent2: '#ffd9c0',
      grip: '#101010', butt: '#f26722', bg1: '#140d08', bg2: '#2e1a0d',
      string: '#f0f0ee'
    }
  },
  {
    id: 'gravitypro',
    beamMm: 20.0,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Gravity Pro',
    pattern: '18x20',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 315, balanceMm: 315,
    tension: [48, 57],
    theme: {
      frameA: '#0c1c22', frameB: '#1b6f7d', frameEdge: '#061014',
      accent: '#2fb3c4', accent2: '#cdf1f6',
      grip: '#0b1418', butt: '#2fb3c4', bg1: '#081215', bg2: '#0f2a30',
      string: '#eaf9fb'
    }
  },
  {
    id: 'prestigemp',
    beamMm: 21.5,
    throatPairs: 4,
    brand: 'HEAD',
    model: 'Prestige MP',
    pattern: '18x19',
    headSize: 99,
    headWidth: 250, headLength: 320, shapeN: 2.37,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 320, balanceMm: 310,
    tension: [48, 57],
    theme: {
      frameA: '#12100f', frameB: '#6e0f1c', frameEdge: '#080606',
      accent: '#c8a24a', accent2: '#f4e3b4',
      grip: '#12100f', butt: '#c8a24a', bg1: '#100c0a', bg2: '#2a1416',
      string: '#e8dcc4'
    }
  },
  {
    id: 'extremepro',
    beamMm: 23.0,
    throatPairs: 3,
    brand: 'HEAD',
    model: 'Extreme Pro',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 320,
    tension: [48, 57],
    theme: {
      frameA: '#14200c', frameB: '#6ca82a', frameEdge: '#0a1206',
      accent: '#96d02f', accent2: '#e4ffbc',
      grip: '#101609', butt: '#96d02f', bg1: '#0d1408', bg2: '#1e2d10',
      string: '#f3ffdf'
    }
  },
  {
    id: 'pureaero100',
    beamMm: 26.0,
    throatPairs: 3,
    brand: 'Babolat',
    model: 'Pure Aero 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [50, 59],
    theme: {
      frameA: '#141414', frameB: '#3a3a34', frameEdge: '#000000',
      accent: '#f5e02a', accent2: '#fff7a8',
      grip: '#141414', butt: '#f5e02a', bg1: '#12120c', bg2: '#26240f',
      string: '#111111'
    }
  },
  {
    id: 'puredrive107',
    beamMm: 26.0,
    throatPairs: 3,
    brand: 'Babolat',
    model: 'Pure Drive 107',
    pattern: '16x19',
    headSize: 107,
    headWidth: 259, headLength: 333, shapeN: 2.33,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 285, balanceMm: 330,
    tension: [44, 53],
    theme: {
      frameA: '#0b2f8f', frameB: '#2f7bff', frameEdge: '#06184d',
      accent: '#2f7bff', accent2: '#bcd6ff',
      grip: '#0a1020', butt: '#ffffff', bg1: '#071026', bg2: '#0e2350',
      string: '#ffffff'
    }
  },
  {
    id: 'purestrike100',
    beamMm: 23.0,
    throatPairs: 4,
    brand: 'Babolat',
    model: 'Pure Strike 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [48, 57],
    theme: {
      frameA: '#8f9198', frameB: '#d8d9dd', frameEdge: '#2d2f35',
      accent: '#d61f26', accent2: '#1c1f24',
      grip: '#16181c', butt: '#d61f26', bg1: '#131519', bg2: '#262a30',
      string: '#1a1c20'
    }
  },
  {
    id: 'ezone100',
    beamMm: 26.5,
    throatPairs: 3,
    brand: 'Yonex',
    model: 'EZONE 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 252, headLength: 303, shapeN: 2.62, // isometric
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 60],
    theme: {
      frameA: '#00306b', frameB: '#0f9bd8', frameEdge: '#001a3d',
      accent: '#19c3f2', accent2: '#bff0ff',
      grip: '#08131f', butt: '#19c3f2', bg1: '#05101f', bg2: '#0a2b45',
      string: '#eaf6ff'
    }
  },
  {
    id: 'vcore98',
    beamMm: 23.5,
    throatPairs: 3,
    brand: 'Yonex',
    model: 'VCORE 98',
    pattern: '16x19',
    headSize: 98,
    headWidth: 249, headLength: 300, shapeN: 2.60, // isometric
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 315,
    tension: [45, 60],
    theme: {
      frameA: '#3d0d0d', frameB: '#c4171c', frameEdge: '#1c0505',
      accent: '#e02b22', accent2: '#ffc9c2',
      grip: '#150a0a', butt: '#e02b22', bg1: '#150809', bg2: '#331113',
      string: '#fff0ee'
    }
  },
  {
    id: 'vcore100',
    beamMm: 26.0,
    throatPairs: 3,
    brand: 'Yonex',
    model: 'VCORE 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 252, headLength: 303, shapeN: 2.62, // isometric
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 60],
    theme: {
      frameA: '#3d0d0d', frameB: '#c4171c', frameEdge: '#1c0505',
      accent: '#e02b22', accent2: '#ffc9c2',
      grip: '#150a0a', butt: '#e02b22', bg1: '#150809', bg2: '#331113',
      string: '#fff0ee'
    }
  },
  {
    id: 'percept97',
    beamMm: 21.0,
    throatPairs: 4,
    brand: 'Yonex',
    model: 'Percept 97',
    pattern: '16x19',
    headSize: 97,
    headWidth: 247, headLength: 299, shapeN: 2.60, // isometric
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 310, balanceMm: 310,
    tension: [45, 60],
    theme: {
      frameA: '#1f2616', frameB: '#5d6b3a', frameEdge: '#0e1209',
      accent: '#a3b35e', accent2: '#e6edc8',
      grip: '#151a0f', butt: '#a3b35e', bg1: '#10140b', bg2: '#232b17',
      string: '#f4f6ea'
    }
  },
  {
    id: 'percept100',
    beamMm: 22.0,
    throatPairs: 4,
    brand: 'Yonex',
    model: 'Percept 100',
    pattern: '16x19',
    headSize: 100,
    headWidth: 252, headLength: 303, shapeN: 2.62, // isometric
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [45, 60],
    theme: {
      frameA: '#1f2616', frameB: '#5d6b3a', frameEdge: '#0e1209',
      accent: '#a3b35e', accent2: '#e6edc8',
      grip: '#151a0f', butt: '#a3b35e', bg1: '#10140b', bg2: '#232b17',
      string: '#f4f6ea'
    }
  },
  {
    id: 'tf40s',
    beamMm: 22.0,
    throatPairs: 4,
    brand: 'Tecnifibre',
    model: 'TF40 305',
    pattern: '16x19',
    headSize: 98,
    headWidth: 248, headLength: 318, shapeN: 2.38,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 305, balanceMm: 320,
    tension: [49, 55],
    theme: {
      frameA: '#8892a1', frameB: '#d3dae3', frameEdge: '#2a313b',
      accent: '#12325f', accent2: '#7f8b9c',
      grip: '#15181c', butt: '#12325f', bg1: '#121519', bg2: '#242a31',
      string: '#ffffff'
    }
  },
  {
    id: 'tfight300',
    beamMm: 22.5,
    throatPairs: 3,
    brand: 'Tecnifibre',
    model: 'TFight 300 ISO',
    pattern: '16x19',
    headSize: 100,
    headWidth: 251, headLength: 322, shapeN: 2.36,
    mainSpan: 0.86, crossTop: 0.885, crossBottom: 0.845, headBias: 0.52,
    weightG: 300, balanceMm: 320,
    tension: [49, 55],
    theme: {
      frameA: '#8b939e', frameB: '#d6dbe1', frameEdge: '#2c323a',
      accent: '#d81f28', accent2: '#7d8794',
      grip: '#17191d', butt: '#d81f28', bg1: '#131519', bg2: '#262a31',
      string: '#1d2025'
    }
  }
];

/* ---------------------------------------------------------------------------
 * Two different jobs were being done by one colour.
 *
 * `theme.accent` themes the UI chrome for the selected racket AND was what the
 * frame was painted in AND what every instructional mark was drawn in. That is
 * one colour too few. It painted the tip in the highlight colour -- which is
 * both a manufacturer's colour-blocking and the reason a knot marker vanished
 * on the frames whose accent matched their own paint (the red Pure Strike, the
 * red VCORE). So the two frame-facing jobs get their own names:
 *
 *   paintAccent        the muted tint on the frame and the bumper
 *   instructionAccent  knots, markers, pull arrows, labels -- never the frame
 *
 * Neither is authored by hand, so no racket can be given a colour scheme that
 * fails the contrast rule by accident:
 *
 *   paintAccent is the accent pulled toward the frame's own body and then
 *   toward a warm neutral -- an original, muted relative of the real colour
 *   family rather than the colour itself.
 *
 *   instructionAccent keeps the racket's own accent when that accent is far
 *   enough from every colour ON the frame, and otherwise takes the furthest
 *   signal colour from a fixed set. Distance is redmean, which is close enough
 *   to perceptual at these saturations and needs no colour-space library.
 * ------------------------------------------------------------------------- */
(function () {
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i] * t);

  /* redmean: a cheap approximation of perceived difference */
  function dist(a, b) {
    const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
    return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2
                   + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
  }

  /* Distance alone is not enough: a bright red marker on the VCORE's dark red
     frame scores well on any lightness-aware metric and still reads as part of
     the paint. A marker also has to be a different HUE from anything on the
     frame that has a hue at all. */
  function hsl(h) {
    const [r, g, b] = rgb(h).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let H = 0;
    if (d > 1e-6) {
      if (mx === r) H = ((g - b) / d) % 6;
      else if (mx === g) H = (b - r) / d + 2;
      else H = (r - g) / d + 4;
      H *= 60; if (H < 0) H += 360;
    }
    const L = (mx + mn) / 2;
    return { h: H, s: d < 1e-6 ? 0 : d / (1 - Math.abs(2 * L - 1)), l: L };
  }
  const hueGap = (a, b) => { const d = Math.abs(hsl(a).h - hsl(b).h); return Math.min(d, 360 - d); };

  function fromHsl(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
            : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return hex(t.map(v => (v + m) * 255));
  }

  /* Mixing toward a warm anchor keeps a warm accent warm, but it barely moves
     the hue -- so the gold frames came out reading as copper. Anything already
     in the gold band is rotated the rest of the way to a muted mustard. The
     band is deliberately narrow: reds, oranges and greens keep their own
     family, and only the colours that were meant to be gold become gold. */
  const goldward = c => {
    const p = hsl(c);
    if (p.h < 26 || p.h > 72) return c;
    // Rotation alone still read as bronze at UI scale, because mixing toward
    // the frame body had taken the lightness down with it. Held back up, the
    // same hue reads as mustard; the caps stop it going lemon.
    return fromHsl(p.h + (46 - p.h) * 0.85, Math.min(p.s * 1.1, 0.70),
                   Math.min(p.l * 1.12, 0.50));
  };

  // red first, so a racket keeps the familiar red marker unless its own frame
  // is red; then cyan, amber, and a near-white as the always-available fallback
  const SIGNALS = ['#ff4d4f', '#3ddcff', '#ffc233', '#f2f5f9'];
  const CLEAR = 130;                    // "far enough from the frame" threshold
  const HUE_GAP = 40;                   // degrees, against any coloured frame

  RACKETS.forEach(r => {
    const t = r.theme;
    // pulled toward the frame's own body, then toward a warm ochre: enough to
    // mute the accent into a paint rather than a highlight, not so far that it
    // goes olive and loses the colour family it came from
    t.paintAccent = t.paintAccent || goldward(hex(mix(hex(mix(t.accent, t.frameA, 0.26)), '#a06a28', 0.28)));

    /* A mid-tone accent on a LIGHT frame is the loudest pairing there is: the
       band at the tip reads as colour blocking however far its opacity comes
       down, because it is the contrast doing the work, not the alpha. Those
       frames get the accent pulled further into their own body colour instead
       of a separate hand-picked palette. */
    if (hsl(t.frameA).l > 0.45) t.paintAccent = hex(mix(t.paintAccent, t.frameA, 0.32));

    const onFrame = [t.frameA, t.frameB, t.frameEdge, t.paintAccent];
    // a near-grey frame colour constrains lightness but not hue
    const clears = (c, fr) => dist(c, fr) >= CLEAR
      && (hsl(fr).s < 0.2 || hsl(c).s < 0.12 || hueGap(c, fr) >= HUE_GAP);
    const score = c => Math.min.apply(null, onFrame.map(fr => dist(c, fr)));
    if (!t.instructionAccent) {
      const pool = [t.accent].concat(SIGNALS);
      t.instructionAccent = pool.find(c => onFrame.every(fr => clears(c, fr)))
        || pool.reduce((best, c) => score(c) > score(best) ? c : best);
    }
    // the light tint the marker labels are set in, kept in the marker's family
    t.instructionInk = t.instructionInk || hex(mix(t.instructionAccent, '#ffffff', 0.66));
  });
})();

/* A frame is named by its model, the way a player names it: "Blade 98",
   "Pro Staff 97L", "Clash 100". Only the version suffix goes ("Blade 98 v9"
   is "Blade 98"). Head-size numbers stay, so every frame in the catalogue is
   listed on its own. RACKET_ALIASES maps an old saved racket id to a current
   one. It is empty now, but old saves and job.js still read it. */
const racketName = r => r.model.replace(/\s+v\d+$/i, '');
const RACKET_ALIASES = {};

