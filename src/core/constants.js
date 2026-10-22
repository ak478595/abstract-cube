/**
 * CubeLab - Mathematical Rubik's Cube Engine & Group Theory Model
 * Reference: Aadi Krishnan (VIT) "A Group-Theoretic and Computational Analysis of the Rubik's Cube"
 * Sections 3.6 & 5.2
 */

// Color standard:
// U: White (#FFFFFF)
// D: Yellow (#FFD500)
// F: Green (#009E60)
// B: Blue (#0051BA)
// L: Orange (#FF5800)
// R: Red (#C41E3A)
// Interior / Plastic: Charcoal Black (#18181B)

export const FACE_COLORS = {
  U: 0xffffff, // Up - White
  D: 0xffd500, // Down - Yellow
  F: 0x009e60, // Front - Green
  B: 0x0051ba, // Back - Blue
  L: 0xff5800, // Left - Orange
  R: 0xc41e3a, // Right - Red
  CORE: 0x18181b // Cubie body - Sleek dark charcoal
};

export const FACE_NAMES = {
  U: 'Up (White)',
  D: 'Down (Yellow)',
  F: 'Front (Green)',
  B: 'Back (Blue)',
  L: 'Left (Orange)',
  R: 'Right (Red)'
};

/**
 * Standard Mathematical Slot Convention from Paper Table 1 & Figure 1:
 * Corner Slots (1-8):
 * URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB
 * Edge Slots (1-12):
 * UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR
 */

export const CORNER_SLOTS = [
  'URF', 'UFL', 'ULB', 'UBR',
  'DFR', 'DLF', 'DBL', 'DRB'
];

export const EDGE_SLOTS = [
  'UR', 'UF', 'UL', 'UB',
  'DR', 'DF', 'DL', 'DB',
  'FR', 'FL', 'BL', 'BR'
];

// Cycles from Table 1 of the VIT paper:
export const GENERATOR_CYCLES = {
  U: {
    corners: ['URF', 'UFL', 'ULB', 'UBR'],
    edges: ['UR', 'UF', 'UL', 'UB'],
    cornerTwists: [0, 0, 0, 0], // Table 2: none
    edgeFlips: [0, 0, 0, 0]      // Table 2: none
  },
  R: {
    corners: ['URF', 'UBR', 'DRB', 'DFR'],
    edges: ['UR', 'BR', 'DR', 'FR'],
    cornerTwists: [1, 2, 1, 2], // Table 2: +1, +2, +1, +2 (total 6 = 0 mod 3)
    edgeFlips: [0, 0, 0, 0]     // Table 2: R, L: none
  },
  F: {
    corners: ['URF', 'DFR', 'DLF', 'UFL'],
    edges: ['UF', 'FR', 'DF', 'FL'],
    cornerTwists: [1, 2, 1, 2],
    edgeFlips: [1, 1, 1, 1]     // Table 2: F, B: all 4 moved edges flipped
  },
  D: {
    corners: ['DFR', 'DRB', 'DBL', 'DLF'],
    edges: ['DR', 'DB', 'DL', 'DF'],
    cornerTwists: [0, 0, 0, 0],
    edgeFlips: [0, 0, 0, 0]
  },
  L: {
    corners: ['UFL', 'DLF', 'DBL', 'ULB'],
    edges: ['UL', 'FL', 'DL', 'BL'],
    cornerTwists: [1, 2, 1, 2],
    edgeFlips: [0, 0, 0, 0]
  },
  B: {
    corners: ['ULB', 'DBL', 'DRB', 'UBR'],
    edges: ['UB', 'BL', 'DB', 'BR'],
    cornerTwists: [1, 2, 1, 2],
    edgeFlips: [1, 1, 1, 1]
  }
};

/**
 * Theoretical sequences from Section 5.2 Table 3 for direct mathematical verification
 */
export const PAPER_TABLE_3 = [
  { sequence: 'R', cornerCycles: '4 (0)', edgeCycles: '4 (0)', parity: 'odd, odd', order: 4 },
  { sequence: 'R2', cornerCycles: '2, 2', edgeCycles: '2, 2', parity: 'even, even', order: 2 },
  { sequence: "R'", cornerCycles: '4 (0)', edgeCycles: '4 (0)', parity: 'odd, odd', order: 4 },
  { sequence: 'R U', cornerCycles: '5 (2), 1 (1)', edgeCycles: '7 (0)', parity: 'even, even', order: 105 },
  { sequence: "R U R' U'", cornerCycles: '2 (1), 2 (2)', edgeCycles: '3 (0)', parity: 'even, even', order: 6 },
  { sequence: 'R2 U2', cornerCycles: '3, 3', edgeCycles: '3, 2, 2', parity: 'even, even', order: 6 },
  { sequence: 'F R', cornerCycles: '5 (2), 1 (1)', edgeCycles: '7 (0)', parity: 'even, even', order: 105 },
  { sequence: "R U2 D' B D'", cornerCycles: '3 (2), 5 (1)', edgeCycles: '7 (1), 2 (0), 2 (1)', parity: 'even, even', order: 1260 }
];

/**
 * 54 Facelet indices in standard Cube.js format:
 * U1..U9 (0..8)
 * R1..R9 (9..17)
 * F1..F9 (18..26)
 * D1..D9 (27..35)
 * L1..L3 (36..44)
 * B1..B9 (45..53)
 */
export const FACE_OFFSETS = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45
};

export const INVERSE_MOVES = {
  'U': "U'", "U'": 'U', 'U2': 'U2',
  'D': "D'", "D'": 'D', 'D2': 'D2',
  'L': "L'", "L'": 'L', 'L2': 'L2',
  'R': "R'", "R'": 'R', 'R2': 'R2',
  'F': "F'", "F'": 'F', 'F2': 'F2',
  'B': "B'", "B'": 'B', 'B2': 'B2'
};

export const MOVE_DIRECTIONS = {
  'U': { face: 'Up', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "U'": { face: 'Up', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'U2': { face: 'Up', direction: 'Half-turn (180°)', quarterTurns: 2 },
  'D': { face: 'Down', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "D'": { face: 'Down', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'D2': { face: 'Down', direction: 'Half-turn (180°)', quarterTurns: 2 },
  'L': { face: 'Left', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "L'": { face: 'Left', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'L2': { face: 'Left', direction: 'Half-turn (180°)', quarterTurns: 2 },
  'R': { face: 'Right', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "R'": { face: 'Right', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'R2': { face: 'Right', direction: 'Half-turn (180°)', quarterTurns: 2 },
  'F': { face: 'Front', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "F'": { face: 'Front', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'F2': { face: 'Front', direction: 'Half-turn (180°)', quarterTurns: 2 },
  'B': { face: 'Back', direction: 'Clockwise (90°)', quarterTurns: 1 },
  "B'": { face: 'Back', direction: 'Counterclockwise (90°)', quarterTurns: -1 },
  'B2': { face: 'Back', direction: 'Half-turn (180°)', quarterTurns: 2 }
};
