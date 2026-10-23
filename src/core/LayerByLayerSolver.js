/**
 * LayerByLayerSolver.js
 *
 * Genuine Layer-by-Layer (LBL) Rubik's Cube Solver (Beginner Method)
 * Solves any arbitrary valid 3x3x3 Rubik's cube state in 4 clearly defined stages:
 *
 * Stage 1: First-Layer Cross (White Cross on U)
 *   - Uses the beginner "Daisy" methodology on the bottom (D) face,
 *     then turns each matched petal 180° into the U face.
 * Stage 2: First-Layer Corners (White Corners on U)
 *   - Uses standard beginner corner insertions (R' D' R D) to place
 *     each of the 4 White corners into URF, UFL, ULB, UBR while preserving the Cross.
 * Stage 3: Middle-Layer Edges (FR, FL, BL, BR)
 *   - Uses classic beginner 8-move edge insertion algorithms:
 *     (D' R' D R D F D' F') and (D L D' L' D' F' D F)
 *     to place all 4 equator edges, solving the First Two Layers (F2L).
 * Stage 4: Last Layer (Yellow on D)
 *   - Substep 4.1: Edge Orientation (Yellow Cross) using F' R' D' R D F
 *   - Substep 4.2: Edge Permutation using Sune on D (R D R' D R D2 R')
 *   - Substep 4.3: Corner Permutation using Niklas on D (D R D' L' D R' D' L)
 *   - Substep 4.4: Corner Orientation using repeated (R U' R' U) x 2
 *   - Substep 4.5: Final Alignment (D / D' / D2 if needed)
 *
 * Move notation strictly uses legal face turns: U, D, L, R, F, B and their ' / 2 modifiers.
 */

import Cube from './cube-lib.js';

// The 4 White edge piece IDs (UR=0, UF=1, UL=2, UB=3)
const WHITE_EDGES = [0, 1, 2, 3];
// The 4 D edge slots (DR=4, DF=5, DL=6, DB=7)
const D_SLOTS = [4, 5, 6, 7];

// Stage 2 Corner definitions
const CORNERS_INFO = [
  { id: 0, uSlot: 0, dSlot: 4, alg: "R' D' R D", kick: "R' D' R" },
  { id: 1, uSlot: 1, dSlot: 5, alg: "F' D' F D", kick: "F' D' F" },
  { id: 2, uSlot: 2, dSlot: 6, alg: "L' D' L D", kick: "L' D' L" },
  { id: 3, uSlot: 3, dSlot: 7, alg: "B' D' B D", kick: "B' D' B" }
];

// Stage 3 Middle edge insertions and kick moves
const MIDDLE_INSERTIONS = [
  { targetSlot: 8, setupSlot: 5, alg: "D' R' D R D F D' F'" },
  { targetSlot: 8, setupSlot: 4, alg: "D F D' F' D' R' D R" },
  { targetSlot: 9, setupSlot: 5, alg: "D L D' L' D' F' D F" },
  { targetSlot: 9, setupSlot: 6, alg: "D' F' D F D L D' L'" },
  { targetSlot: 10, setupSlot: 7, alg: "D' L' D L D B D' B'" },
  { targetSlot: 10, setupSlot: 6, alg: "D B D' B' D' L' D L" },
  { targetSlot: 11, setupSlot: 7, alg: "D R D' R' D' B' D B" },
  { targetSlot: 11, setupSlot: 4, alg: "D' B' D B D R D' R'" }
];

const KICK_ALGS = {
  8: "D' R' D R D F D' F'",
  9: "D L D' L' D' F' D F",
  10: "D' L' D L D B D' B'",
  11: "D' B' D B D R D' R'"
};

// Stage 4.3 Niklas algorithms (8 variations: 4 corners fixed x 2 cycles)
const NIKLAS_ALGS = [
  "D R D' L' D R' D' L",
  "L' D R D' L D R' D'",
  "D F D' B' D F' D' B",
  "B' D F D' B D F' D'",
  "D B D' F' D B' D' F",
  "F' D B D' F D B' D'",
  "D L D' R' D L' D' R",
  "R' D L D' R D L' D'"
];

/**
 * Simplifies consecutive turns on the same face.
 * e.g. ['D', 'D'] -> ['D2'], ['R', "R'"] -> []
 */
export function simplifyMoves(moves) {
  if (!moves || moves.length === 0) return [];
  const faceTurns = { '': 1, "'": 3, '2': 2 };
  const turnsToMod = { 0: null, 1: '', 2: '2', 3: "'" };

  let changed = true;
  let current = [...moves];

  while (changed) {
    changed = false;
    const stack = [];
    for (const m of current) {
      if (!m) continue;
      const face = m[0];
      const mod = m.length > 1 ? m[1] : '';
      const turns = faceTurns[mod];

      if (stack.length > 0 && stack[stack.length - 1][0] === face) {
        const prev = stack.pop();
        const prevMod = prev.length > 1 ? prev[1] : '';
        const prevTurns = faceTurns[prevMod];
        const combined = (prevTurns + turns) % 4;
        if (combined !== 0) {
          stack.push(face + turnsToMod[combined]);
        }
        changed = true;
      } else {
        stack.push(m);
      }
    }
    current = stack;
  }
  return current;
}

/**
 * Check if a slot on D holds a White edge with White facing D (Daisy petal).
 */
function isDaisyPetal(cube, slot) {
  const piece = cube.ep[slot];
  return WHITE_EDGES.includes(piece) && cube.eo[slot] === 0;
}

function countDaisyPetals(cube) {
  return D_SLOTS.filter(s => isDaisyPetal(cube, s)).length;
}

/**
 * Stage 1: Solve White Cross on U
 */
export function solveFirstLayerCross(cube, record) {
  function ensureSlotEmpty(dSlot) {
    let turns = 0;
    while (isDaisyPetal(cube, dSlot) && turns < 4) {
      record("D");
      turns++;
    }
  }

  let iterations = 0;
  while (countDaisyPetals(cube) < 4 && iterations < 50) {
    iterations++;
    let targetPiece = null;
    let targetSlot = null;
    for (const p of WHITE_EDGES) {
      const slot = cube.ep.indexOf(p);
      if (!(D_SLOTS.includes(slot) && cube.eo[slot] === 0)) {
        targetPiece = p;
        targetSlot = slot;
        break;
      }
    }
    if (targetPiece === null) break;

    const ori = cube.eo[targetSlot];

    // Case 1: In U layer (0=UR, 1=UF, 2=UL, 3=UB)
    if ([0, 1, 2, 3].includes(targetSlot)) {
      const uFace = ['R', 'F', 'L', 'B'][targetSlot];
      const correspDSlot = [4, 5, 6, 7][targetSlot];

      if (ori === 0) {
        ensureSlotEmpty(correspDSlot);
        record(`${uFace}2`);
      } else {
        ensureSlotEmpty(correspDSlot);
        record(uFace);
      }
      continue;
    }

    // Case 2: In middle layer (8=FR, 9=FL, 10=BL, 11=BR)
    if ([8, 9, 10, 11].includes(targetSlot)) {
      if (targetSlot === 8) {
        const testCubeF = cube.clone();
        testCubeF.move("F");
        if (testCubeF.eo[5] === 0) {
          ensureSlotEmpty(5);
          record("F");
        } else {
          ensureSlotEmpty(4);
          record("R'");
        }
      } else if (targetSlot === 9) {
        const testCubeF = cube.clone();
        testCubeF.move("F'");
        if (testCubeF.eo[5] === 0) {
          ensureSlotEmpty(5);
          record("F'");
        } else {
          ensureSlotEmpty(6);
          record("L");
        }
      } else if (targetSlot === 10) {
        const testCubeB = cube.clone();
        testCubeB.move("B");
        if (testCubeB.eo[7] === 0) {
          ensureSlotEmpty(7);
          record("B");
        } else {
          ensureSlotEmpty(6);
          record("L'");
        }
      } else if (targetSlot === 11) {
        const testCubeB = cube.clone();
        testCubeB.move("B'");
        if (testCubeB.eo[7] === 0) {
          ensureSlotEmpty(7);
          record("B'");
        } else {
          ensureSlotEmpty(4);
          record("R");
        }
      }
      continue;
    }

    // Case 3: In D layer, but inverted (White on side)
    if (D_SLOTS.includes(targetSlot) && ori === 1) {
      const side = ['R', 'F', 'L', 'B'][targetSlot - 4];
      ensureSlotEmpty(targetSlot);
      record(side);
      continue;
    }
  }

  // Petals into Cross (turn matched sides 180° into U)
  const targets = [
    { face: 'F', piece: 1, dSlot: 5 },
    { face: 'R', piece: 0, dSlot: 4 },
    { face: 'B', piece: 3, dSlot: 7 },
    { face: 'L', piece: 2, dSlot: 6 }
  ];

  for (const t of targets) {
    let turns = 0;
    while (cube.ep[t.dSlot] !== t.piece && turns < 4) {
      record("D");
      turns++;
    }
    record(`${t.face}2`);
  }
}

/**
 * Stage 2: Solve First-Layer Corners (White Corners on U)
 */
export function solveFirstLayerCorners(cube, record) {
  for (const info of CORNERS_INFO) {
    let curSlot = cube.cp.indexOf(info.id);
    let curOri = cube.co[curSlot];

    if (curSlot === info.uSlot && curOri === 0) continue;

    if ([0, 1, 2, 3].includes(curSlot)) {
      record(CORNERS_INFO[curSlot].kick);
      curSlot = cube.cp.indexOf(info.id);
    }

    let dTurns = 0;
    while (cube.cp[info.dSlot] !== info.id && dTurns < 4) {
      record("D");
      dTurns++;
    }

    let reps = 0;
    while (!(cube.cp[info.uSlot] === info.id && cube.co[info.uSlot] === 0) && reps < 6) {
      record(info.alg);
      reps++;
    }
  }
}

/**
 * Stage 3: Solve Middle-Layer Edges (FR, FL, BL, BR)
 */
export function solveMiddleLayer(cube, record) {
  const middlePieces = [8, 9, 10, 11];

  let iterations = 0;
  while (iterations < 20) {
    iterations++;
    const allDone = middlePieces.every(p => cube.ep[p] === p && cube.eo[p] === 0);
    if (allDone) break;

    for (const p of middlePieces) {
      let curSlot = cube.ep.indexOf(p);
      let curOri = cube.eo[curSlot];

      if (curSlot === p && curOri === 0) continue;

      if ([8, 9, 10, 11].includes(curSlot)) {
        record(KICK_ALGS[curSlot]);
        break;
      }

      const candidates = MIDDLE_INSERTIONS.filter(ins => ins.targetSlot === p);
      let solvedThisPiece = false;
      for (const cand of candidates) {
        for (let d = 0; d < 4; d++) {
          const testCube = cube.clone();
          const dMove = d === 1 ? "D" : d === 2 ? "D2" : d === 3 ? "D'" : "";
          if (dMove) testCube.move(dMove);
          testCube.move(cand.alg);
          if (testCube.ep[p] === p && testCube.eo[p] === 0) {
            if (dMove) record(dMove);
            record(cand.alg);
            solvedThisPiece = true;
            break;
          }
        }
        if (solvedThisPiece) break;
      }
      if (solvedThisPiece) break;
    }
  }
}

/**
 * Stage 4.1: Last Layer Edge Orientation (Yellow Cross on D)
 */
export function orientLastLayerEdges(cube, record) {
  const dEdges = [4, 5, 6, 7];
  if (dEdges.every(s => cube.eo[s] === 0)) return;

  for (const d1 of ['', 'D', 'D2', "D'"]) {
    const t1 = cube.clone();
    if (d1) t1.move(d1);
    t1.move("F' R' D' R D F");
    if (dEdges.every(s => t1.eo[s] === 0)) {
      if (d1) record(d1);
      record("F' R' D' R D F");
      return;
    }
  }

  for (const d1 of ['', 'D', 'D2', "D'"]) {
    for (const d2 of ['', 'D', 'D2', "D'"]) {
      const t = cube.clone();
      if (d1) t.move(d1);
      t.move("F' R' D' R D F");
      if (d2) t.move(d2);
      t.move("F' R' D' R D F");
      if (dEdges.every(s => t.eo[s] === 0)) {
        if (d1) record(d1);
        record("F' R' D' R D F");
        if (d2) record(d2);
        record("F' R' D' R D F");
        return;
      }
    }
  }

  for (const d1 of ['', 'D', 'D2', "D'"]) {
    for (const d2 of ['', 'D', 'D2', "D'"]) {
      for (const d3 of ['', 'D', 'D2', "D'"]) {
        const t = cube.clone();
        if (d1) t.move(d1);
        t.move("F' R' D' R D F");
        if (d2) t.move(d2);
        t.move("F' R' D' R D F");
        if (d3) t.move(d3);
        t.move("F' R' D' R D F");
        if (dEdges.every(s => t.eo[s] === 0)) {
          if (d1) record(d1);
          record("F' R' D' R D F");
          if (d2) record(d2);
          record("F' R' D' R D F");
          if (d3) record(d3);
          record("F' R' D' R D F");
          return;
        }
      }
    }
  }
}

/**
 * Stage 4.2: Last Layer Edge Permutation (Sune on D)
 */
export function permuteLastLayerEdges(cube, record) {
  const dEdges = [4, 5, 6, 7];

  for (const d0 of ['', 'D', 'D2', "D'"]) {
    const t0 = cube.clone();
    if (d0) t0.move(d0);
    if (dEdges.every(s => t0.ep[s] === s && t0.eo[s] === 0)) {
      if (d0) record(d0);
      return;
    }
  }

  for (const d1 of ['', 'D', 'D2', "D'"]) {
    for (const df of ['', 'D', 'D2', "D'"]) {
      const t = cube.clone();
      if (d1) t.move(d1);
      t.move("R D R' D R D2 R'");
      if (df) t.move(df);
      if (dEdges.every(s => t.ep[s] === s && t.eo[s] === 0)) {
        if (d1) record(d1);
        record("R D R' D R D2 R'");
        if (df) record(df);
        return;
      }
    }
  }

  for (const d1 of ['', 'D', 'D2', "D'"]) {
    for (const d2 of ['', 'D', 'D2', "D'"]) {
      for (const df of ['', 'D', 'D2', "D'"]) {
        const t = cube.clone();
        if (d1) t.move(d1);
        t.move("R D R' D R D2 R'");
        if (d2) t.move(d2);
        t.move("R D R' D R D2 R'");
        if (df) t.move(df);
        if (dEdges.every(s => t.ep[s] === s && t.eo[s] === 0)) {
          if (d1) record(d1);
          record("R D R' D R D2 R'");
          if (d2) record(d2);
          record("R D R' D R D2 R'");
          if (df) record(df);
          return;
        }
      }
    }
  }
}

/**
 * Stage 4.3: Last Layer Corner Permutation (Niklas on D)
 */
export function permuteLastLayerCorners(cube, record) {
  const dCorners = [4, 5, 6, 7];
  for (let step = 0; step < 3; step++) {
    if (dCorners.every(s => cube.cp[s] === s)) break;

    let bestAlg = null;
    for (const alg of NIKLAS_ALGS) {
      const test = cube.clone();
      test.move(alg);
      if (dCorners.every(s => test.cp[s] === s)) {
        bestAlg = alg;
        break;
      }
    }

    if (bestAlg) {
      record(bestAlg);
      break;
    }

    record(NIKLAS_ALGS[0]);
  }
}

/**
 * Stage 4.4: Last Layer Corner Orientation ((R U' R' U) x 2 on D)
 */
export function orientLastLayerCorners(cube, record) {
  for (let c = 0; c < 4; c++) {
    while (cube.co[4] !== 0) {
      record("R U' R' U R U' R' U");
    }
    record("D");
  }
}

/**
 * LayerByLayerSolver Class
 */
export class LayerByLayerSolver {
  /**
   * Solves an arbitrary valid cube using the beginner Layer-by-Layer method.
   *
   * @param {Cube|LogicalCube} inputCube - Cube instance or LogicalCube
   * @returns {Object} Solution summary including moves, stages, verification
   */
  static solve(inputCube) {
    const t0 = performance.now();

    // Support both LogicalCube and Cube instance
    const rawCube = inputCube?.cube ? inputCube.cube : inputCube;
    if (!rawCube || typeof rawCube.clone !== 'function') {
      throw new Error('LayerByLayerSolver.solve requires a valid Cube or LogicalCube instance');
    }

    // Work on an independent clone to ensure no side-effects on original cube
    const workingCube = rawCube.clone();

    // Already solved case
    if (workingCube.isSolved()) {
      return {
        algorithm: 'Layer-by-Layer (LBL)',
        moves: [],
        moveString: '',
        stages: [],
        totalMoves: 0,
        computationTimeMs: Math.round((performance.now() - t0) * 100) / 100,
        verified: true,
        isSolved: true
      };
    }

    const stages = [];
    const allMoves = [];

    function makeStageRecorder(stageName) {
      const stageMoves = [];
      const record = (alg) => {
        if (!alg) return;
        const tokens = alg.trim().split(/\s+/).filter(Boolean);
        for (const m of tokens) {
          workingCube.move(m);
          stageMoves.push(m);
          allMoves.push(m);
        }
      };
      return { stageMoves, record };
    }

    // Stage 1: First-Layer Cross
    {
      const rec = makeStageRecorder('First-Layer Cross');
      solveFirstLayerCross(workingCube, rec.record);
      stages.push({ name: 'First-Layer Cross', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 2: First-Layer Corners
    {
      const rec = makeStageRecorder('First-Layer Corners');
      solveFirstLayerCorners(workingCube, rec.record);
      stages.push({ name: 'First-Layer Corners', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 3: Middle-Layer Edges
    {
      const rec = makeStageRecorder('Middle-Layer Edges');
      solveMiddleLayer(workingCube, rec.record);
      stages.push({ name: 'Middle-Layer Edges', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 4.1: Last-Layer Edge Orientation
    {
      const rec = makeStageRecorder('Last-Layer Edge Orientation');
      orientLastLayerEdges(workingCube, rec.record);
      stages.push({ name: 'Last-Layer Edge Orientation', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 4.2: Last-Layer Edge Permutation
    {
      const rec = makeStageRecorder('Last-Layer Edge Permutation');
      permuteLastLayerEdges(workingCube, rec.record);
      stages.push({ name: 'Last-Layer Edge Permutation', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 4.3: Last-Layer Corner Permutation
    {
      const rec = makeStageRecorder('Last-Layer Corner Permutation');
      permuteLastLayerCorners(workingCube, rec.record);
      stages.push({ name: 'Last-Layer Corner Permutation', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 4.4: Last-Layer Corner Orientation
    {
      const rec = makeStageRecorder('Last-Layer Corner Orientation');
      orientLastLayerCorners(workingCube, rec.record);
      stages.push({ name: 'Last-Layer Corner Orientation', moves: simplifyMoves(rec.stageMoves) });
    }

    // Stage 4.5: Final Alignment
    {
      const rec = makeStageRecorder('Final Alignment');
      for (const dMove of ['', 'D', 'D2', "D'"]) {
        const test = workingCube.clone();
        if (dMove) test.move(dMove);
        if (test.isSolved()) {
          if (dMove) rec.record(dMove);
          break;
        }
      }
      if (rec.stageMoves.length > 0) {
        stages.push({ name: 'Final Alignment', moves: simplifyMoves(rec.stageMoves) });
      }
    }

    // Simplify the entire solution sequence
    const simplifiedMoves = simplifyMoves(allMoves);
    const moveString = simplifiedMoves.join(' ');
    const tSolveEnd = performance.now();
    const solveDurationMs = tSolveEnd - t0;

    // MANDATORY VALIDATION: Apply computed solution to a fresh clone of original state
    const tValStart = performance.now();
    const verificationClone = rawCube.clone();
    if (simplifiedMoves.length > 0) {
      verificationClone.move(moveString);
    }
    const verified = verificationClone.isSolved();
    const tValEnd = performance.now();
    const validationDurationMs = tValEnd - tValStart;
    const totalDurationMs = performance.now() - t0;

    // Accurate move metrics
    const htm = simplifiedMoves.length;
    let qtm = 0;
    for (const m of simplifiedMoves) {
      qtm += m.includes('2') ? 2 : 1;
    }

    if (!verified) {
      console.error('LayerByLayerSolver: Verification failed on computed moves!', moveString);
      return {
        algorithm: 'Layer-by-Layer (LBL)',
        moves: simplifiedMoves,
        moveString,
        stages,
        totalMoves: htm,
        htm,
        qtm,
        computationTimeMs: solveDurationMs,
        solveTimeMs: solveDurationMs,
        initTimeMs: 0,
        validationTimeMs: validationDurationMs,
        totalElapsedMs: totalDurationMs,
        verified: false,
        isSolved: false,
        error: 'Computed solution failed verification on cloned state'
      };
    }

    return {
      algorithm: 'Layer-by-Layer (LBL)',
      moves: simplifiedMoves,
      moveString,
      stages,
      totalMoves: htm,
      htm,
      qtm,
      computationTimeMs: solveDurationMs,
      solveTimeMs: solveDurationMs,
      initTimeMs: 0,
      validationTimeMs: validationDurationMs,
      totalElapsedMs: totalDurationMs,
      verified: true,
      isSolved: true
    };
  }

  solve(cube) {
    return LayerByLayerSolver.solve(cube);
  }
}

export function solveLayerByLayer(cube) {
  return LayerByLayerSolver.solve(cube);
}
