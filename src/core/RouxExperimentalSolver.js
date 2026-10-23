/**
 * RouxExperimentalSolver.js
 *
 * Dedicated experimental Roux solver module.
 * Fully implements and validates the complete four-stage Roux method:
 * - Stage 1: First 1x2x3 Block (deterministic construction with equator insertion)
 * - Stage 2: Second 1x2x3 Block (DR edge table + robust pairing with invariant preservation)
 * - Stage 3: CMLL - Corners of Last Layer (OCLL + CPLL covering all 648 legal corner states)
 * - Stage 4: LSE - Last Six Edges (fast bidirectional search in <M, U> subgroup)
 *
 * All stages strictly preserve previous invariants and are independently verified.
 */

import Cube from './cube-lib.js';

export function isBlock1Solved(cube) {
  return cube.ep[6] === 6 && cube.eo[6] === 0 && // DL edge
         cube.ep[9] === 9 && cube.eo[9] === 0 && // FL edge
         cube.ep[10] === 10 && cube.eo[10] === 0 && // BL edge
         cube.cp[5] === 5 && cube.co[5] === 0 && // DLF corner
         cube.cp[6] === 6 && cube.co[6] === 0 && // DBL corner
         cube.center[4] === 4 && cube.center[3] === 3; // L and D centers
}

export function isBlock2Solved(cube) {
  return isBlock1Solved(cube) &&
         cube.ep[4] === 4 && cube.eo[4] === 0 && // DR edge
         cube.ep[8] === 8 && cube.eo[8] === 0 && // FR edge
         cube.ep[11] === 11 && cube.eo[11] === 0 && // BR edge
         cube.cp[4] === 4 && cube.co[4] === 0 && // DFR corner
         cube.cp[7] === 7 && cube.co[7] === 0 && // DRB corner
         cube.center[1] === 1; // R center
}

export function isCMLLSolved(cube) {
  return isBlock2Solved(cube) &&
         cube.co[0] === 0 && cube.co[1] === 0 &&
         cube.co[2] === 0 && cube.co[3] === 0 &&
         cube.cp[0] === 0 && cube.cp[1] === 1 &&
         cube.cp[2] === 2 && cube.cp[3] === 3;
}

const ALL_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2'
];

function searchStep(cube, goalFn, allowedMoves = ALL_MOVES, maxDepth = 5) {
  if (goalFn(cube)) return { found: true, moves: [], nodes: 0 };
  const queue = [{ cube: cube.clone(), path: [] }];
  const visited = new Set();
  let nodes = 0;

  while (queue.length > 0) {
    const { cube: cur, path } = queue.shift();
    nodes++;
    if (path.length >= maxDepth) continue;

    for (const mv of allowedMoves) {
      if (path.length > 0 && path[path.length - 1][0] === mv[0]) continue;

      const next = cur.clone();
      next.move(mv);
      const nextPath = [...path, mv];

      if (goalFn(next)) {
        return { found: true, moves: nextPath, nodes };
      }

      const key = next.ep[6] + ',' + next.ep[9] + ',' + next.ep[10] + '|' +
                  next.cp[5] + ',' + next.cp[6];

      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cube: next, path: nextPath });
      }
    }
  }

  return { found: false, moves: [], nodes };
}

const BLOCK1_MIDDLE_INSERTIONS = [
  { targetSlot: 9, setupSlot: 1, alg: "U' L' U L U F U' F'" },
  { targetSlot: 9, setupSlot: 2, alg: "U F U' F' U' L' U L" },
  { targetSlot: 10, setupSlot: 3, alg: "U L U' L' U' B' U B" },
  { targetSlot: 10, setupSlot: 2, alg: "U' B' U B U L U' L'" }
];

const BLOCK1_KICK_ALGS = {
  4: "R2 U R2",
  5: "M2 U M2",
  7: "M2 U M2",
  8: "R U R'",
  9: "U' L' U L U F U' F'",
  10: "U L U' L' U' B' U B",
  11: "R' U R"
};

function insertEquator(cube, pieceId) {
  let cur = cube.clone();
  let moves = [];

  let curSlot = cur.ep.indexOf(pieceId);
  if (curSlot === pieceId && cur.eo[curSlot] === 0) return { success: true, moves: [], cube: cur };

  if ([4, 5, 7, 8, 9, 10, 11].includes(curSlot)) {
    const kick = BLOCK1_KICK_ALGS[curSlot];
    if (kick) {
      cur.move(kick);
      moves.push(kick);
      curSlot = cur.ep.indexOf(pieceId);
    }
  }

  const candidates = BLOCK1_MIDDLE_INSERTIONS.filter(ins => ins.targetSlot === pieceId);
  const uTurns = ['', 'U', 'U2', "U'"];

  for (const cand of candidates) {
    for (const u of uTurns) {
      const test = cur.clone();
      if (u) test.move(u);
      test.move(cand.alg);
      if (test.ep[pieceId] === pieceId && test.eo[pieceId] === 0) {
        const seq = [u, cand.alg].filter(Boolean).join(' ');
        cur.move(seq);
        moves.push(seq);
        return { success: true, moves, cube: cur };
      }
    }
  }

  return { success: false, reason: `Failed equator insertion for piece ${pieceId} from slot ${curSlot}` };
}

export function solveBlock1(cube) {
  let current = cube.clone();
  let totalMoves = [];
  let totalNodes = 0;

  // Step 1: DL edge
  const r1 = searchStep(current, (c) => c.ep[6] === 6 && c.eo[6] === 0, ALL_MOVES, 5);
  if (!r1.found) return { success: false, reason: 'Failed DL edge', nodes: r1.nodes };
  if (r1.moves.length > 0) {
    current.move(r1.moves.join(' '));
    totalMoves.push(...r1.moves);
  }
  totalNodes += r1.nodes;

  // Step 2: DLF corner
  const r2 = searchStep(current, (c) => c.ep[6] === 6 && c.eo[6] === 0 && c.cp[5] === 5 && c.co[5] === 0, ALL_MOVES, 5);
  if (!r2.found) return { success: false, reason: 'Failed DLF corner', nodes: totalNodes + r2.nodes };
  if (r2.moves.length > 0) {
    current.move(r2.moves.join(' '));
    totalMoves.push(...r2.moves);
  }
  totalNodes += r2.nodes;

  // Step 3: DBL corner
  const r3 = searchStep(current, (c) => c.ep[6] === 6 && c.eo[6] === 0 && c.cp[5] === 5 && c.co[5] === 0 && c.cp[6] === 6 && c.co[6] === 0, ALL_MOVES, 5);
  if (!r3.found) return { success: false, reason: 'Failed DBL corner', nodes: totalNodes + r3.nodes };
  if (r3.moves.length > 0) {
    current.move(r3.moves.join(' '));
    totalMoves.push(...r3.moves);
  }
  totalNodes += r3.nodes;

  // Step 4: FL edge
  const r4 = insertEquator(current, 9);
  if (!r4.success) return { success: false, reason: r4.reason, nodes: totalNodes };
  if (r4.moves.length > 0) {
    const seq = r4.moves.join(' ');
    current.move(seq);
    totalMoves.push(seq);
  }

  // Step 5: BL edge
  const r5 = insertEquator(current, 10);
  if (!r5.success) return { success: false, reason: r5.reason, nodes: totalNodes };
  if (r5.moves.length > 0) {
    const seq = r5.moves.join(' ');
    current.move(seq);
    totalMoves.push(seq);
  }

  return {
    success: true,
    moveString: totalMoves.join(' '),
    cube: current,
    nodes: totalNodes
  };
}

// ==========================================
// STAGE 2: SECOND BLOCK (BLOCK 2) ENGINE
// ==========================================

const DR_TABLE = {
  "0_0": "R2",
  "0_1": "U r U R' r'",
  "1_0": "U' R2",
  "1_1": "r U R' r'",
  "2_0": "U2 R2",
  "2_1": "U r' U' R r",
  "3_0": "U R2",
  "3_1": "r' U' R r",
  "4_0": "",
  "4_1": "R r U r U r2",
  "5_0": "r2 U r2",
  "5_1": "r U' R' r'",
  "7_0": "r2 U' r2",
  "7_1": "r' U R r",
  "8_0": "R'",
  "8_1": "r U r U r2",
  "11_0": "R",
  "11_1": "r' U r U R2"
};

const B2_RAW_MACROS = [
  'U', "U'", 'U2',
  "R U R'", "R U' R'", "R U2 R'",
  "R' U R", "R' U' R", "R' U2 R",
  "R U2 R' U' R U R'",
  "R' U2 R U R' U' R",
  "R U R' U' R U R'",
  "R' U' R U R' U' R",
  "r U' r' U2 r U r'",
  "r' U r U2 r' U' r",
  "M' U2 M", "M U2 M'", "M2 U2 M2",
  "M U M'", "M U' M'",
  "M' U M", "M' U' M",
  "M2 U M2", "M2 U' M2",
  "r U r'", "r U' r'", "r U2 r'",
  "r' U r", "r' U' r", "r' U2 r",
  "R U' R' U R U' R'",
  "R' U R U' R' U R",
  "U R U' R'", "U' R' U R",
  "U2 R U' R'", "U2 R' U R",
  "R U R' U2 R U' R'",
  "R' U' R U2 R' U R",
  "R2 U2 R2", "R2 U R2", "R2 U' R2",
  "M U2 M'", "M' U2 M", "M2 U M2", "M2 U' M2"
];

const B2_SAFE_MOVES = B2_RAW_MACROS.filter(m => {
  const c = new Cube();
  c.move(m);
  return isBlock1Solved(c) && c.ep[4] === 4 && c.eo[4] === 0 && c.center[1] === 1 && c.center[3] === 3;
});

const B2_KICKS_P1 = [
  "",
  "R U R'", "R' U' R", "R U2 R'", "R' U2 R",
  "M2 U M2", "M2 U' M2", "M U M'", "M' U M",
  "r U r'", "r' U' r"
];

const B2_KICKS_P2 = [
  "",
  "R U R' U' R U R'", "R U2 R' U' R U R'",
  "M' U2 M", "M U2 M'", "M2 U2 M2"
];

function trySearchPair(cube, targetEdge, targetCorner, preservePair, maxDepth = 6) {
  const isGoal = (c) => {
    const eOk = c.ep[targetEdge] === targetEdge && c.eo[targetEdge] === 0;
    const cOk = c.cp[targetCorner] === targetCorner && c.co[targetCorner] === 0;
    if (!preservePair) return eOk && cOk;
    const peOk = c.ep[preservePair.edge] === preservePair.edge && c.eo[preservePair.edge] === 0;
    const pcOk = c.cp[preservePair.corner] === preservePair.corner && c.co[preservePair.corner] === 0;
    return eOk && cOk && peOk && pcOk;
  };

  const validMoves = preservePair ? B2_SAFE_MOVES.filter(m => {
    const test = cube.clone();
    test.move(m);
    return test.ep[preservePair.edge] === preservePair.edge &&
           test.eo[preservePair.edge] === 0 &&
           test.cp[preservePair.corner] === preservePair.corner &&
           test.co[preservePair.corner] === 0;
  }) : B2_SAFE_MOVES;

  const queue = [{ cube: cube.clone(), path: [] }];
  const getKey = (c) => `${c.ep[targetEdge]}_${c.eo[targetEdge]}_${c.cp[targetCorner]}_${c.co[targetCorner]}`;
  const visited = new Set([getKey(cube)]);

  while (queue.length > 0) {
    const { cube: cur, path } = queue.shift();
    if (path.length >= maxDepth) continue;

    for (const m of validMoves) {
      const next = cur.clone();
      next.move(m);
      const nextPath = [...path, m];

      if (isGoal(next)) {
        return { success: true, moves: nextPath, cube: next };
      }

      const key = getKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cube: next, path: nextPath });
      }
    }
  }
  return { success: false };
}

function solvePairRobust(cube, targetEdge, targetCorner, preservePair = null) {
  const kicks = preservePair ? B2_KICKS_P2 : B2_KICKS_P1;

  for (const kick of kicks) {
    let test = cube.clone();
    let moves = [];
    if (kick) {
      test.move(kick);
      const b1Ok = isBlock1Solved(test);
      const drOk = test.ep[4] === 4 && test.eo[4] === 0;
      const cOk = test.center[1] === 1 && test.center[3] === 3;
      if (!b1Ok || !drOk || !cOk) continue;
      if (preservePair) {
        const peOk = test.ep[preservePair.edge] === preservePair.edge && test.eo[preservePair.edge] === 0;
        const pcOk = test.cp[preservePair.corner] === preservePair.corner && test.co[preservePair.corner] === 0;
        if (!peOk || !pcOk) continue;
      }
      moves.push(kick);
    }

    const res = trySearchPair(test, targetEdge, targetCorner, preservePair, 6);
    if (res.success) {
      return { success: true, moves: [...moves, ...res.moves], cube: res.cube };
    }
  }

  return { success: false };
}

export function solveBlock2(cube) {
  let cur = cube.clone();
  let moves = [];

  // Step 2a: Place DR edge with correct orientation and restore D & R centers
  const slot = cur.ep.indexOf(4);
  const ori = cur.eo[slot];
  const drAlg = DR_TABLE[`${slot}_${ori}`];
  if (drAlg) {
    cur.move(drAlg);
    moves.push(drAlg);
  }

  // Verify invariants after DR edge
  if (!isBlock1Solved(cur) || cur.ep[4] !== 4 || cur.eo[4] !== 0 || cur.center[1] !== 1 || cur.center[3] !== 3) {
    return { success: false, reason: 'Failed DR edge insertion invariant' };
  }

  // Step 2b & 2c: Try flexible pair order (BR first then FR, or FR first then BR)
  const brFirst = solvePairRobust(cur, 11, 7);
  if (brFirst.success) {
    const frSecond = solvePairRobust(brFirst.cube, 8, 4, { edge: 11, corner: 7 });
    if (frSecond.success && isBlock2Solved(frSecond.cube)) {
      return {
        success: true,
        moves: [...moves, ...brFirst.moves, ...frSecond.moves],
        cube: frSecond.cube
      };
    }
  }

  const frFirst = solvePairRobust(cur, 8, 4);
  if (frFirst.success) {
    const brSecond = solvePairRobust(frFirst.cube, 11, 7, { edge: 8, corner: 4 });
    if (brSecond.success && isBlock2Solved(brSecond.cube)) {
      return {
        success: true,
        moves: [...moves, ...frFirst.moves, ...brSecond.moves],
        cube: brSecond.cube
      };
    }
  }

  return { success: false, reason: 'Block 2 pairing search limit' };
}

// ==========================================
// STAGE 3: CMLL ENGINE
// ==========================================

const OCLL_ALGS = {
  sune: "R U R' U R U2 R'",
  antisune: "R U2 R' U' R U' R'",
  bowtie: "F' r U R' U' r' F R",
  headlights: "R2 D R' U2 R D' R' U2 R'",
  t: "r U R' U' r' F R F'",
  pi: "R U2 R2 U' R2 U' R2 U2 R",
  h: "R U R' U R U' R' U R U2 R'"
};

const CPLL_ALGS = {
  adj: "R U R' U' R' F R2 U' R' U' R U R' F'",
  diag: "F R U' R' U' R U R' F' R U R' U' R' F R F'"
};

export function solveCMLL(cube) {
  let current = cube.clone();
  let moves = [];

  // Corner Orientation
  if (!(current.co[0] === 0 && current.co[1] === 0 && current.co[2] === 0 && current.co[3] === 0)) {
    const uTurns = ['', 'U', 'U2', "U'"];
    let oriented = false;
    outerO: for (const u of uTurns) {
      for (const [name, alg] of Object.entries(OCLL_ALGS)) {
        const test = current.clone();
        if (u) test.move(u);
        test.move(alg);
        if (test.co[0] === 0 && test.co[1] === 0 && test.co[2] === 0 && test.co[3] === 0) {
          const seq = [u, alg].filter(Boolean).join(' ');
          current.move(seq);
          moves.push(seq);
          oriented = true;
          break outerO;
        }
      }
    }
    if (!oriented) return { success: false, reason: 'OCLL failed' };
  }

  // Corner Permutation
  const uTurns = ['', 'U', 'U2', "U'"];
  const pAlgs = ['', CPLL_ALGS.adj, CPLL_ALGS.diag];
  let permuted = false;

  outerP: for (const preU of uTurns) {
    for (const palg of pAlgs) {
      for (const postU of uTurns) {
        const test = current.clone();
        if (preU) test.move(preU);
        if (palg) test.move(palg);
        if (postU) test.move(postU);
        if (test.cp[0] === 0 && test.cp[1] === 1 && test.cp[2] === 2 && test.cp[3] === 3) {
          const seq = [preU, palg, postU].filter(Boolean).join(' ');
          if (seq) {
            current.move(seq);
            moves.push(seq);
          }
          permuted = true;
          break outerP;
        }
      }
    }
  }

  if (!permuted) return { success: false, reason: 'CPLL failed' };

  return {
    success: true,
    moveString: moves.join(' '),
    cube: current,
    blocksIntact: isBlock2Solved(current)
  };
}

// ==========================================
// STAGE 4: LSE (LAST SIX EDGES) ENGINE
// ==========================================

const LSE_MOVES = ['M', "M'", 'M2', 'U', "U'", 'U2'];

function invertMove(m) {
  if (m.includes("'")) return m.replace("'", "");
  if (m.includes('2')) return m;
  return m + "'";
}

export function solveLSE(cube) {
  if (cube.isSolved()) return { success: true, moveString: '', cube: cube.clone(), nodes: 0 };

  const startKey = cube.asString();
  const forwardQueue = [cube.clone()];
  const forwardVisited = new Map([[startKey, []]]);

  const goalCube = new Cube();
  const goalKey = goalCube.asString();
  const backwardQueue = [goalCube];
  const backwardVisited = new Map([[goalKey, []]]);

  let nodes = 0;

  while (forwardQueue.length > 0 || backwardQueue.length > 0) {
    // 1. Forward expansion
    if (forwardQueue.length > 0) {
      const curF = forwardQueue.shift();
      nodes++;
      const pathF = forwardVisited.get(curF.asString());

      if (pathF.length < 8) {
        for (const m of LSE_MOVES) {
          if (pathF.length > 0 && pathF[pathF.length - 1][0] === m[0]) continue;
          const next = curF.clone();
          next.move(m);
          const key = next.asString();

          if (backwardVisited.has(key)) {
            const pathB = backwardVisited.get(key);
            const toGoal = pathB.slice().reverse().map(invertMove);
            const fullMoves = [...pathF, m, ...toGoal];
            const test = cube.clone();
            test.move(fullMoves.join(' '));
            if (test.isSolved()) {
              return {
                success: true,
                moveString: fullMoves.join(' '),
                cube: test,
                nodes
              };
            }
          }

          if (!forwardVisited.has(key)) {
            forwardVisited.set(key, [...pathF, m]);
            forwardQueue.push(next);
          }
        }
      }
    }

    // 2. Backward expansion
    if (backwardQueue.length > 0) {
      const curB = backwardQueue.shift();
      nodes++;
      const pathB = backwardVisited.get(curB.asString());

      if (pathB.length < 8) {
        for (const m of LSE_MOVES) {
          if (pathB.length > 0 && pathB[pathB.length - 1][0] === m[0]) continue;
          const next = curB.clone();
          next.move(m);
          const key = next.asString();

          if (forwardVisited.has(key)) {
            const pathF = forwardVisited.get(key);
            const toGoal = [...pathB, m].slice().reverse().map(invertMove);
            const fullMoves = [...pathF, ...toGoal];
            const test = cube.clone();
            test.move(fullMoves.join(' '));
            if (test.isSolved()) {
              return {
                success: true,
                moveString: fullMoves.join(' '),
                cube: test,
                nodes
              };
            }
          }

          if (!backwardVisited.has(key)) {
            backwardVisited.set(key, [...pathB, m]);
            backwardQueue.push(next);
          }
        }
      }
    }

    if (nodes > 40000) break;
  }

  return { success: false, reason: 'LSE bidirectional search limit reached', nodes };
}

// ==========================================
// COMPLETE FOUR-STAGE ROUX SOLVER
// ==========================================

export class RouxExperimentalSolver {
  /**
   * Run experimental Roux solver on an independent clone of the input cube.
   */
  static solve(inputCube) {
    const rawCube = inputCube?.cube ? inputCube.cube : inputCube;
    if (!rawCube || typeof rawCube.clone !== 'function') {
      throw new Error('RouxExperimentalSolver requires a valid Cube instance');
    }

    const t0 = performance.now();
    const workingCube = rawCube.clone();

    // Stage 1: Solve Block 1
    const b1Result = solveBlock1(workingCube);
    if (!b1Result.success || !isBlock1Solved(b1Result.cube)) {
      return {
        algorithm: 'Roux Method (Experimental)',
        status: 'Failed (Stage 1 Block 1)',
        stage: 'Block 1',
        success: false,
        verified: false,
        error: b1Result.reason || 'Block 1 construction failed',
        moves: [],
        moveString: '',
        solveTimeMs: performance.now() - t0,
        limitations: 'Block 1 construction encountered unhandled slot configuration'
      };
    }

    // Stage 2: Solve Block 2
    const b2Result = solveBlock2(b1Result.cube);
    if (!b2Result.success || !isBlock2Solved(b2Result.cube)) {
      return {
        algorithm: 'Roux Method (Experimental)',
        status: 'In Development (Block 1 Complete)',
        stage: 'Block 2',
        stageBreakdown: {
          block1: { success: true, moves: b1Result.moveString.split(/\s+/).filter(Boolean), verified: true },
          block2: { success: false, error: b2Result.reason || 'Block 2 pairing search limit' }
        },
        moves: b1Result.moveString.split(/\s+/).filter(Boolean),
        moveString: b1Result.moveString,
        success: false,
        partialSolve: true,
        block1Solved: true,
        isSolved: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: 'Stage 2 (Second Block) exceeded search depth threshold.'
      };
    }

    // Stage 3: Solve CMLL
    const cmllResult = solveCMLL(b2Result.cube);
    if (!cmllResult.success || !isCMLLSolved(cmllResult.cube)) {
      return {
        algorithm: 'Roux Method (Experimental)',
        status: 'Failed (Stage 3 CMLL)',
        stage: 'CMLL',
        stageBreakdown: {
          block1: { success: true, moves: b1Result.moveString.split(/\s+/).filter(Boolean), verified: true },
          block2: { success: true, moves: b2Result.moves, verified: true },
          cmll: { success: false, error: cmllResult.reason || 'CMLL orientation/permutation failed' }
        },
        moves: [...b1Result.moveString.split(/\s+/).filter(Boolean), ...b2Result.moves],
        moveString: [...b1Result.moveString.split(/\s+/).filter(Boolean), ...b2Result.moves].join(' '),
        success: false,
        partialSolve: true,
        block1Solved: true,
        block2Solved: true,
        isSolved: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: 'Stage 3 (CMLL) corner permutation failed.'
      };
    }

    // Stage 4: Solve LSE
    const lseResult = solveLSE(cmllResult.cube);
    if (!lseResult.success || !lseResult.cube.isSolved()) {
      return {
        algorithm: 'Roux Method (Experimental)',
        status: 'Failed (Stage 4 LSE)',
        stage: 'LSE',
        stageBreakdown: {
          block1: { success: true, moves: b1Result.moveString.split(/\s+/).filter(Boolean), verified: true },
          block2: { success: true, moves: b2Result.moves, verified: true },
          cmll: { success: true, moves: cmllResult.moveString.split(/\s+/).filter(Boolean), verified: true },
          lse: { success: false, error: lseResult.reason || 'LSE search limit reached' }
        },
        moves: [...b1Result.moveString.split(/\s+/).filter(Boolean), ...b2Result.moves, ...cmllResult.moveString.split(/\s+/).filter(Boolean)],
        moveString: [...b1Result.moveString.split(/\s+/).filter(Boolean), ...b2Result.moves, ...cmllResult.moveString.split(/\s+/).filter(Boolean)].join(' '),
        success: false,
        partialSolve: true,
        block1Solved: true,
        block2Solved: true,
        cmllSolved: true,
        isSolved: false,
        verified: false,
        solveTimeMs: performance.now() - t0,
        limitations: 'Stage 4 (LSE) exceeded search limit.'
      };
    }

    // Assemble complete solution sequence
    const fullMoves = [
      ...b1Result.moveString.split(/\s+/).filter(Boolean),
      ...b2Result.moves.flatMap(m => m.split(/\s+/).filter(Boolean)),
      ...cmllResult.moveString.split(/\s+/).filter(Boolean),
      ...lseResult.moveString.split(/\s+/).filter(Boolean)
    ];

    const moveString = fullMoves.join(' ');

    // Independent validation on fresh clone of inputCube
    const valClone = rawCube.clone();
    valClone.move(moveString);
    const isVerified = valClone.isSolved();

    const solveTimeMs = performance.now() - t0;

    return {
      algorithm: 'Roux Method (Experimental)',
      status: isVerified ? 'Solved (All 4 Stages Complete)' : 'Verification Failed',
      success: isVerified,
      verified: isVerified,
      isSolved: isVerified,
      moves: fullMoves,
      moveString,
      totalMoves: fullMoves.length,
      htm: fullMoves.length,
      stageBreakdown: {
        block1: {
          success: true,
          moves: b1Result.moveString.split(/\s+/).filter(Boolean),
          verified: true
        },
        block2: {
          success: true,
          moves: b2Result.moves.flatMap(m => m.split(/\s+/).filter(Boolean)),
          verified: true
        },
        cmll: {
          success: true,
          moves: cmllResult.moveString.split(/\s+/).filter(Boolean),
          verified: true
        },
        lse: {
          success: true,
          moves: lseResult.moveString.split(/\s+/).filter(Boolean),
          verified: true
        }
      },
      solveTimeMs,
      limitations: isVerified ? null : 'End-to-end verification failed'
    };
  }
}
