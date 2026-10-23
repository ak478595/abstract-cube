/**
 * CFOPSolver.js
 *
 * Dedicated CFOP-X (Experimental) Solver
 *
 * Implements the complete four-stage speedcubing pipeline with adaptive lookahead:
 *
 * 1. Stage 1: Cross with Lookahead Evaluation
 *    - Explores multiple candidate cross orderings on the bottom (D) face.
 *    - Scores candidates based on move count and bonus preservation of formed F2L pairs.
 * 2. Stage 2: Genuine Speedcubing F2L with Simultaneous Corner-Edge Pairing
 *    - Solves all four first-two-layer pairs (FR, FL, BL, BR) with invariant preservation.
 *    - Evaluates multiple slot solving permutations to maximize efficiency.
 *    - Pairs corners and edges in the U layer using genuine speedcubing triggers.
 * 3. Stage 3: Two-Look OLL (Orientation of the Last Layer)
 *    - Substep 3.1: Edge Orientation (EO)
 *    - Substep 3.2: 7-Case Corner Orientation (CO) (Sune, Anti-Sune, H, Pi, Headlights, T, Bowtie)
 * 4. Stage 4: Two-Look PLL (Permutation of the Last Layer)
 *    - Substep 4.1: Corner Permutation (CP) using T-perm / Y-perm with pre/post AUF
 *    - Substep 4.2: Direct Edge Permutation (EP) using pure corner-preserving conjugates of Ua / Ub / H / Z
 *    - Substep 4.3: Final AUF Alignment
 *
 * Independent implementation: does NOT call Kociemba or LBL.
 */

import Cube from './cube-lib.js';
import { simplifyMoves } from './LayerByLayerSolver.js';

const ALL_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
const uTurns = ['', 'U', 'U2', "U'"];

// -------------------------------------------------------------
// STAGE 1: CROSS WITH BOUNDED LOOKAHEAD EVALUATION
// -------------------------------------------------------------

export function isCrossSolved(cube) {
  return cube.ep[4] === 4 && cube.eo[4] === 0 &&
         cube.ep[5] === 5 && cube.eo[5] === 0 &&
         cube.ep[6] === 6 && cube.eo[6] === 0 &&
         cube.ep[7] === 7 && cube.eo[7] === 0;
}

export function searchCrossPiece(cube, goalFn, allowedMoves = ALL_MOVES, maxDepth = 5) {
  if (goalFn(cube)) return { found: true, moves: [], cube: cube.clone() };

  const queue = [{ cube: cube.clone(), path: [] }];
  const visited = new Set();

  while (queue.length > 0) {
    const { cube: cur, path } = queue.shift();
    if (path.length >= maxDepth) continue;

    for (const m of allowedMoves) {
      if (path.length > 0 && path[path.length - 1][0] === m[0]) continue;
      const next = cur.clone();
      next.move(m);
      const nextPath = [...path, m];

      if (goalFn(next)) {
        return { found: true, moves: nextPath, cube: next };
      }

      const key = `${next.ep[4]}_${next.eo[4]}_${next.ep[5]}_${next.eo[5]}_${next.ep[6]}_${next.eo[6]}_${next.ep[7]}_${next.eo[7]}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cube: next, path: nextPath });
      }
    }
  }
  return { found: false, moves: [], cube: cube.clone() };
}

export function solveCrossLookahead(cube) {
  const orderings = [
    [4, 5, 6, 7], // DR, DF, DL, DB
    [5, 4, 7, 6], // DF, DR, DB, DL
    [6, 5, 4, 7], // DL, DF, DR, DB
    [7, 6, 5, 4]  // DB, DL, DF, DR
  ];

  let best = null;

  for (const order of orderings) {
    let cur = cube.clone();
    let moves = [];
    let possible = true;

    for (let i = 0; i < order.length; i++) {
      const targetPieces = order.slice(0, i + 1);
      const goal = (c) => targetPieces.every(p => c.ep[p] === p && c.eo[p] === 0);
      const res = searchCrossPiece(cur, goal, ALL_MOVES, 5);
      if (!res.found) { possible = false; break; }
      cur = res.cube;
      moves.push(...res.moves);
    }

    if (possible && isCrossSolved(cur)) {
      // Score cross candidate: cost = move length - F2L lookahead bonus
      let f2lBonus = 0;
      if (cur.cp[4] === 4 && cur.co[4] === 0 && cur.ep[8] === 8 && cur.eo[8] === 0) f2lBonus += 8;
      if (cur.cp[5] === 5 && cur.co[5] === 0 && cur.ep[9] === 9 && cur.eo[9] === 0) f2lBonus += 8;
      if (cur.cp[6] === 6 && cur.co[6] === 0 && cur.ep[10] === 10 && cur.eo[10] === 0) f2lBonus += 8;
      if (cur.cp[7] === 7 && cur.co[7] === 0 && cur.ep[11] === 11 && cur.eo[11] === 0) f2lBonus += 8;

      const score = moves.length - f2lBonus;
      if (!best || score < best.score) {
        best = { moves, moveString: moves.join(' '), cube: cur, score, f2lBonus };
      }
    }
  }

  if (best) return { success: true, ...best };
  return { success: false, reason: 'Cross lookahead search limit' };
}

// -------------------------------------------------------------
// STAGE 2: GENUINE SPEEDCUBING F2L (SIMULTANEOUS PAIRING)
// -------------------------------------------------------------

export const F2L_SLOTS = [
  {
    id: 0,
    name: 'FR',
    cId: 4,
    eId: 8,
    kickCorner: "R U R'",
    kickEdge: "R U R' U' F' U' F",
    triggers: ["R U R'", "R U' R'", "R U2 R'", "F' U' F", "F' U F", "F' U2 F"],
    extra: ["R' F R F'", "F R' F' R", "R U2 R2 F R F'", "F' U2 F2 R' F' R", "R U R' U' R U R'", "R U' R' U R U' R'"]
  },
  {
    id: 1,
    name: 'FL',
    cId: 5,
    eId: 9,
    kickCorner: "F U F'",
    kickEdge: "F U F' U' L' U' L",
    triggers: ["F U F'", "F U' F'", "F U2 F'", "L' U' L", "L' U L", "L' U2 L"],
    extra: ["F' L F L'", "L F' L' F", "F U2 F2 L F L'", "L' U2 L2 F' L' F", "F U F' U' F U F'", "F U' F' U F U' F'"]
  },
  {
    id: 2,
    name: 'BL',
    cId: 6,
    eId: 10,
    kickCorner: "L U L'",
    kickEdge: "L U L' U' B' U' B",
    triggers: ["L U L'", "L U' L'", "L U2 L'", "B' U' B", "B' U B", "B' U2 B"],
    extra: ["L' B L B'", "B L' B' L", "L U2 L2 B L B'", "B' U2 B2 L' B' L", "L U L' U' L U L'", "L U' L' U L U' L'"]
  },
  {
    id: 3,
    name: 'BR',
    cId: 7,
    eId: 11,
    kickCorner: "B U B'",
    kickEdge: "B U B' U' R' U' R",
    triggers: ["B U B'", "B U' B'", "B U2 B'", "R' U' R", "R' U R", "R' U2 R"],
    extra: ["B' R B R'", "R B' R' B", "B U2 B2 R B R'", "R' U2 R2 B' R' B", "B U B' U' B U B'", "B U' B' U B U' B'"]
  }
];

function buildSlotAlgs(slot) {
  const list = [];
  // 1. Single triggers with U setup
  for (const u of uTurns) {
    for (const t of slot.triggers) {
      list.push([u, t].filter(Boolean).join(' '));
    }
  }
  // 2. Extra specialized triggers with U setup
  for (const u of uTurns) {
    for (const t of slot.extra) {
      list.push([u, t].filter(Boolean).join(' '));
    }
  }
  // 3. Double triggers with intermediate U turn (simultaneous pairing + insertion)
  for (const u1 of uTurns) {
    for (const t1 of slot.triggers) {
      for (const u2 of uTurns) {
        for (const t2 of slot.triggers) {
          list.push([u1, t1, u2, t2].filter(Boolean).join(' '));
        }
      }
    }
  }
  return list;
}

const SLOT_ALGS_CACHE = F2L_SLOTS.map(s => buildSlotAlgs(s));

export function solveSingleF2LSlot(cube, slotIndex) {
  const slot = F2L_SLOTS[slotIndex];
  let cur = cube.clone();
  let moves = [];

  // If already solved
  if (cur.cp[slot.cId] === slot.cId && cur.co[slot.cId] === 0 &&
      cur.ep[slot.eId] === slot.eId && cur.eo[slot.eId] === 0) {
    return { success: true, moves: [], cube: cur };
  }

  // Eject corner if trapped in bottom layer
  const cPos = cur.cp.indexOf(slot.cId);
  if ([4, 5, 6, 7].includes(cPos)) {
    const kSlot = F2L_SLOTS.find(s => s.cId === cPos);
    cur.move(kSlot.kickCorner);
    moves.push(kSlot.kickCorner);
  }

  // Eject edge if trapped in equator layer
  const ePos = cur.ep.indexOf(slot.eId);
  if ([8, 9, 10, 11].includes(ePos)) {
    const kSlot = F2L_SLOTS.find(s => s.eId === ePos);
    cur.move(kSlot.kickEdge);
    moves.push(kSlot.kickEdge);
  }

  // Find genuine pairing and insertion sequence
  const algList = SLOT_ALGS_CACHE[slotIndex];
  let bestAlg = null;
  for (const alg of algList) {
    const test = cur.clone();
    test.move(alg);
    if (test.cp[slot.cId] === slot.cId && test.co[slot.cId] === 0 &&
        test.ep[slot.eId] === slot.eId && test.eo[slot.eId] === 0) {
      bestAlg = alg;
      break;
    }
  }

  if (bestAlg) {
    cur.move(bestAlg);
    moves.push(bestAlg);
    return { success: true, moves, cube: cur };
  }

  // Fallback trigger perturbation if adjacent in U
  for (const fallbackKick of [slot.triggers[2], slot.triggers[5], slot.kickCorner]) {
    const kicked = cur.clone();
    kicked.move(fallbackKick);
    for (const alg of algList) {
      const test = kicked.clone();
      test.move(alg);
      if (test.cp[slot.cId] === slot.cId && test.co[slot.cId] === 0 &&
          test.ep[slot.eId] === slot.eId && test.eo[slot.eId] === 0) {
        bestAlg = [fallbackKick, alg].join(' ');
        break;
      }
    }
    if (bestAlg) break;
  }

  if (bestAlg) {
    cur.move(bestAlg);
    moves.push(bestAlg);
    return { success: true, moves, cube: cur };
  }

  return { success: false, reason: `Could not insert slot ${slot.name}` };
}

export function isF2LSolved(cube) {
  if (!isCrossSolved(cube)) return false;
  for (let p = 4; p <= 7; p++) {
    if (cube.cp[p] !== p || cube.co[p] !== 0) return false;
  }
  for (let e = 8; e <= 11; e++) {
    if (cube.ep[e] !== e || cube.eo[e] !== 0) return false;
  }
  return true;
}

export function solveF2L(cube) {
  const orderings = [
    [0, 1, 2, 3],
    [1, 0, 3, 2],
    [2, 3, 0, 1],
    [3, 2, 1, 0]
  ];

  let best = null;
  for (const ord of orderings) {
    let cur = cube.clone();
    let moves = [];
    let possible = true;

    for (const slotIdx of ord) {
      const res = solveSingleF2LSlot(cur, slotIdx);
      if (!res.success) {
        possible = false;
        break;
      }
      cur = res.cube;
      moves.push(...res.moves);
    }

    if (possible && isF2LSolved(cur)) {
      const flat = moves.flatMap(m => m.split(/\s+/).filter(Boolean));
      if (!best || flat.length < best.count) {
        best = { count: flat.length, moves, cube: cur };
      }
    }
  }

  if (best) {
    return {
      success: true,
      moves: best.moves,
      moveString: best.moves.join(' '),
      cube: best.cube
    };
  }
  return { success: false, reason: 'Adaptive F2L failed' };
}

// -------------------------------------------------------------
// STAGE 3: TWO-LOOK OLL
// -------------------------------------------------------------

const EO_ALGS = [
  "F R U R' U' F'",
  "F U R U' R' F'",
  "F R U R' U' F' U2 F U R U' R' F'"
];

const CO_7_ALGS = [
  "R U R' U R U2 R'",              // Sune
  "R U2 R' U' R U' R'",            // Anti-Sune
  "R U2 R' U' R U R' U' R U' R'",  // H
  "R U2 R2 U' R2 U' R2 U2 R",      // Pi
  "R2 D R' U2 R D' R' U2 R'",      // Headlights
  "r U R' U' r' F R F'",           // T
  "F' r U R' U' r' F R"            // Bowtie
];

export function isOLLSolved(cube) {
  return isF2LSolved(cube) &&
         cube.eo[0] === 0 && cube.eo[1] === 0 && cube.eo[2] === 0 && cube.eo[3] === 0 &&
         cube.co[0] === 0 && cube.co[1] === 0 && cube.co[2] === 0 && cube.co[3] === 0;
}

export function solveOLL(cube) {
  let cur = cube.clone();
  let moves = [];

  // Step 3.1: Edge Orientation
  if (!(cur.eo[0] === 0 && cur.eo[1] === 0 && cur.eo[2] === 0 && cur.eo[3] === 0)) {
    let eoFound = false;
    for (const u of uTurns) {
      for (const alg of EO_ALGS) {
        const test = cur.clone();
        if (u) test.move(u);
        test.move(alg);
        if (test.eo[0] === 0 && test.eo[1] === 0 && test.eo[2] === 0 && test.eo[3] === 0) {
          const seq = [u, alg].filter(Boolean).join(' ');
          cur.move(seq);
          moves.push(seq);
          eoFound = true;
          break;
        }
      }
      if (eoFound) break;
    }
    if (!eoFound) return { success: false, reason: 'OLL edge orientation failed' };
  }

  // Step 3.2: 7-Case Corner Orientation
  if (!(cur.co[0] === 0 && cur.co[1] === 0 && cur.co[2] === 0 && cur.co[3] === 0)) {
    let coFound = false;
    for (const u of uTurns) {
      for (const alg of CO_7_ALGS) {
        const test = cur.clone();
        if (u) test.move(u);
        test.move(alg);
        if (test.co[0] === 0 && test.co[1] === 0 && test.co[2] === 0 && test.co[3] === 0) {
          const seq = [u, alg].filter(Boolean).join(' ');
          cur.move(seq);
          moves.push(seq);
          coFound = true;
          break;
        }
      }
      if (coFound) break;
    }
    if (!coFound) return { success: false, reason: 'OLL corner orientation failed' };
  }

  return { success: true, moves, moveString: moves.join(' '), cube: cur };
}

// -------------------------------------------------------------
// STAGE 4: TWO-LOOK PLL WITH DIRECT EDGE PERMUTATIONS
// -------------------------------------------------------------

const CP_ALGS = [
  "",
  "R U R' U' R' F R2 U' R' U' R U R' F'", // T-perm
  "F R U' R' U' R U R' F' R U R' U' R' F R F'" // Y-perm
];

const Ua = "R U' R U R U R U' R' U' R2";
const Ub = "R2 U R U R' U' R' U' R' U R'";
const H = "R2 U2 R U2 R2 U2 R2 U2 R U2 R2";
const Z = "R' U' R U' R U R U' R' U R U R2 U' R' U2";

// Pure corner-preserving edge conjugates
const PURE_EDGE_OPS = [''];
for (const base of [Ua, Ub, H, Z]) {
  for (const u of uTurns) {
    const invU = u === 'U' ? "U'" : u === "U'" ? 'U' : u === 'U2' ? 'U2' : '';
    const seq = [u, base, invU].filter(Boolean).join(' ');
    PURE_EDGE_OPS.push(seq);
  }
}

export function solvePLL(cube) {
  let cur = cube.clone();
  let moves = [];

  // Step 4.1: Corner Permutation
  if (!(cur.cp[0] === 0 && cur.cp[1] === 1 && cur.cp[2] === 2 && cur.cp[3] === 3)) {
    let cpFound = false;
    outerCP: for (const preU of uTurns) {
      for (const alg of CP_ALGS) {
        for (const postU of uTurns) {
          const test = cur.clone();
          if (preU) test.move(preU);
          if (alg) test.move(alg);
          if (postU) test.move(postU);

          if (test.cp[0] === 0 && test.cp[1] === 1 && test.cp[2] === 2 && test.cp[3] === 3) {
            const seq = [preU, alg, postU].filter(Boolean).join(' ');
            if (seq) {
              cur.move(seq);
              moves.push(seq);
            }
            cpFound = true;
            break outerCP;
          }
        }
      }
    }
    if (!cpFound) return { success: false, reason: 'PLL corner permutation failed' };
  }

  // Step 4.2: Direct Edge Permutation using pure corner-preserving operations
  if (cur.isSolved()) return { success: true, moves, moveString: moves.join(' '), cube: cur };

  for (const op of PURE_EDGE_OPS) {
    const test = cur.clone();
    if (op) test.move(op);
    if (test.isSolved()) {
      if (op) {
        cur.move(op);
        moves.push(op);
      }
      return { success: true, moves, moveString: moves.join(' '), cube: cur };
    }
  }

  return { success: false, reason: 'PLL edge permutation failed' };
}

// -------------------------------------------------------------
// COMPLETE CFOP-X SOLVER CLASS
// -------------------------------------------------------------

export class CFOPSolver {
  /**
   * Solve a cube using CFOP-X (Cross -> F2L -> 2-look OLL -> 2-look PLL).
   *
   * @param {Cube} inputCube - Cube instance or LogicalCube
   * @returns {Object} Solution results
   */
  static solve(inputCube) {
    const rawCube = inputCube?.cube ? inputCube.cube : inputCube;
    if (!rawCube || typeof rawCube.clone !== 'function') {
      throw new Error('CFOPSolver.solve requires a valid Cube instance');
    }

    const t0 = performance.now();
    const workingCube = rawCube.clone();

    // 0. Check if already solved
    if (workingCube.isSolved()) {
      return {
        algorithm: 'CFOP-X (Cross-F2L-OLL-PLL)',
        status: 'Solved',
        success: true,
        verified: true,
        isSolved: true,
        moves: [],
        moveString: '',
        totalMoves: 0,
        htm: 0,
        qtm: 0,
        stageBreakdown: {
          cross: { success: true, moves: [] },
          f2l: { success: true, moves: [] },
          oll: { success: true, moves: [] },
          pll: { success: true, moves: [] }
        },
        solveTimeMs: performance.now() - t0,
        limitations: null
      };
    }

    // Stage 1: Cross with Lookahead
    const crossRes = solveCrossLookahead(workingCube);
    if (!crossRes.success || !isCrossSolved(crossRes.cube)) {
      return {
        algorithm: 'CFOP-X (Cross-F2L-OLL-PLL)',
        status: 'Failed (Cross)',
        stage: 'Cross',
        success: false,
        verified: false,
        error: crossRes.reason || 'Cross construction failed',
        moves: [],
        moveString: '',
        solveTimeMs: performance.now() - t0,
        limitations: 'Cross search exceeded depth limit'
      };
    }

    // Stage 2: Genuine Speedcubing F2L
    const f2lRes = solveF2L(crossRes.cube);
    if (!f2lRes.success || !isF2LSolved(f2lRes.cube)) {
      return {
        algorithm: 'CFOP-X (Cross-F2L-OLL-PLL)',
        status: 'Failed (F2L)',
        stage: 'F2L',
        stageBreakdown: {
          cross: { success: true, moves: crossRes.moves },
          f2l: { success: false, error: f2lRes.reason || 'F2L insertion failed' }
        },
        moves: crossRes.moves,
        moveString: crossRes.moveString,
        success: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: f2lRes.reason || 'F2L pair insertion failed'
      };
    }

    // Stage 3: Two-Look OLL (7-case CO)
    const ollRes = solveOLL(f2lRes.cube);
    if (!ollRes.success || !isOLLSolved(ollRes.cube)) {
      return {
        algorithm: 'CFOP-X (Cross-F2L-OLL-PLL)',
        status: 'Failed (OLL)',
        stage: 'OLL',
        stageBreakdown: {
          cross: { success: true, moves: crossRes.moves },
          f2l: { success: true, moves: f2lRes.moves },
          oll: { success: false, error: ollRes.reason || 'OLL failed' }
        },
        moves: [...crossRes.moves, ...f2lRes.moves],
        moveString: [...crossRes.moves, ...f2lRes.moves].join(' '),
        success: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: ollRes.reason || 'OLL orientation failed'
      };
    }

    // Stage 4: Two-Look PLL (Direct Edge Permutations)
    const pllRes = solvePLL(ollRes.cube);
    if (!pllRes.success || !pllRes.cube.isSolved()) {
      return {
        algorithm: 'CFOP-X (Cross-F2L-OLL-PLL)',
        status: 'Failed (PLL)',
        stage: 'PLL',
        stageBreakdown: {
          cross: { success: true, moves: crossRes.moves },
          f2l: { success: true, moves: f2lRes.moves },
          oll: { success: true, moves: ollRes.moves },
          pll: { success: false, error: pllRes.reason || 'PLL failed' }
        },
        moves: [...crossRes.moves, ...f2lRes.moves, ...ollRes.moves],
        moveString: [...crossRes.moves, ...f2lRes.moves, ...ollRes.moves].join(' '),
        success: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: pllRes.reason || 'PLL permutation failed'
      };
    }

    // Assemble raw moves and simplify consecutive turns
    const rawMoves = [
      ...crossRes.moves,
      ...f2lRes.moves,
      ...ollRes.moves,
      ...pllRes.moves
    ].flatMap(m => m.split(/\s+/).filter(Boolean));

    const simplified = simplifyMoves(rawMoves);
    const moveString = simplified.join(' ');

    // Independent validation on fresh clone of raw inputCube
    const valClone = rawCube.clone();
    valClone.move(moveString);
    const isVerified = valClone.isSolved();

    const htm = simplified.length;
    let qtm = 0;
    for (const m of simplified) qtm += m.includes('2') ? 2 : 1;

    return {
      algorithm: 'CFOP-X (Experimental)',
      status: isVerified ? 'Solved (All 4 Stages Complete)' : 'Verification Failed',
      success: isVerified,
      verified: isVerified,
      isSolved: isVerified,
      moves: simplified,
      moveString,
      totalMoves: htm,
      htm,
      qtm,
      stageBreakdown: {
        cross: { success: true, moves: crossRes.moves },
        f2l: { success: true, moves: f2lRes.moves },
        oll: { success: true, moves: ollRes.moves },
        pll: { success: true, moves: pllRes.moves }
      },
      solveTimeMs: performance.now() - t0,
      limitations: isVerified ? null : 'End-to-end verification failed'
    };
  }
}
