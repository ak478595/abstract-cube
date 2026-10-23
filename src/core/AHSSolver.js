import Cube from './cube-lib.js';

// Precomputed single-piece distance tables
let tablesInitialized = false;
let tableInitDurationMs = 0;
const cornerDist = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => Array(3).fill(99)));
const edgeDist = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => Array(2).fill(99)));

const MOVES = ['U', 'U2', "U'", 'D', 'D2', "D'", 'R', 'R2', "R'", 'L', 'L2', "L'", 'F', 'F2', "F'", 'B', 'B2', "B'"];
const MOVE_FACES = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
const OPPOSITE_FACES = [1, 0, 3, 2, 5, 4]; // U-D, D-U, R-L, L-R, F-B, B-F
const STATIC_MOVE_INDICES = Array.from({ length: 18 }, (_, i) => i);

/**
 * Initializes single-piece shortest distance tables via breadth-first search from solved state.
 * Fully admissible: tracks the true minimum moves for each piece independently.
 */
export function initAHSTables() {
  if (tablesInitialized) return tableInitDurationMs;
  const t0 = performance.now();

  // Corner BFS
  for (let p = 0; p < 8; p++) {
    cornerDist[p][p][0] = 0;
    const q = [{ slot: p, ori: 0, d: 0 }];
    while (q.length > 0) {
      const { slot, ori, d } = q.shift();
      for (const m of MOVES) {
        const c = new Cube();
        for (let i = 0; i < 8; i++) c.cp[i] = -1;
        c.cp[slot] = p;
        c.co[slot] = ori;
        c.move(m);
        const nextSlot = c.cp.indexOf(p);
        const nextOri = c.co[nextSlot];
        if (cornerDist[p][nextSlot][nextOri] > d + 1) {
          cornerDist[p][nextSlot][nextOri] = d + 1;
          q.push({ slot: nextSlot, ori: nextOri, d: d + 1 });
        }
      }
    }
  }

  // Edge BFS
  for (let p = 0; p < 12; p++) {
    edgeDist[p][p][0] = 0;
    const q = [{ slot: p, ori: 0, d: 0 }];
    while (q.length > 0) {
      const { slot, ori, d } = q.shift();
      for (const m of MOVES) {
        const c = new Cube();
        for (let i = 0; i < 12; i++) c.ep[i] = -1;
        c.ep[slot] = p;
        c.eo[slot] = ori;
        c.move(m);
        const nextSlot = c.ep.indexOf(p);
        const nextOri = c.eo[nextSlot];
        if (edgeDist[p][nextSlot][nextOri] > d + 1) {
          edgeDist[p][nextSlot][nextOri] = d + 1;
          q.push({ slot: nextSlot, ori: nextOri, d: d + 1 });
        }
      }
    }
  }

  tablesInitialized = true;
  tableInitDurationMs = performance.now() - t0;
  return tableInitDurationMs;
}

/**
 * Mathematically Proven Admissible Heuristic h(c):
 * - Any single turn can affect at most 4 corners and 4 edges.
 * - Sum of individual corner distances / 4 <= true remaining distance.
 * - Sum of individual edge distances / 4 <= true remaining distance.
 * - Non-zero corner orientations / 4 <= true remaining distance.
 * - Non-zero edge orientations / 4 <= true remaining distance.
 * - Maximum single piece distance <= true remaining distance.
 * The maximum of these bounds is provably admissible and consistent.
 */
export function calculateAdmissibleHeuristic(cube) {
  if (!tablesInitialized) initAHSTables();

  let sumC = 0, maxC = 0, nonZeroCo = 0;
  for (let s = 0; s < 8; s++) {
    const p = cube.cp[s];
    const o = cube.co[s];
    const d = cornerDist[p][s][o];
    sumC += d;
    if (d > maxC) maxC = d;
    if (o !== 0) nonZeroCo++;
  }

  let sumE = 0, maxE = 0, nonZeroEo = 0;
  for (let s = 0; s < 12; s++) {
    const p = cube.ep[s];
    const o = cube.eo[s];
    const d = edgeDist[p][s][o];
    sumE += d;
    if (d > maxE) maxE = d;
    if (o !== 0) nonZeroEo++;
  }

  const hCornerSum = Math.ceil(sumC / 4);
  const hEdgeSum = Math.ceil(sumE / 4);
  const hCoSum = Math.ceil(nonZeroCo / 4);
  const hEoSum = Math.ceil(nonZeroEo / 4);

  return Math.max(maxC, maxE, hCornerSum, hEdgeSum, hCoSum, hEoSum);
}

function isRedundant(mIdx, prevIdx) {
  if (prevIdx < 0) return false;
  const f1 = MOVE_FACES[mIdx];
  const f2 = MOVE_FACES[prevIdx];
  if (f1 === f2) return true; // Commutative self-turn: e.g. R R
  if (OPPOSITE_FACES[f1] === f2 && f1 < f2) return true; // Canonical ordering for opposing faces: e.g. L R instead of R L
  return false;
}

/**
 * Adaptive Heuristic Search (AHS) Solver
 * Combines an admissible relaxation lower bound with dynamic adaptive move ordering.
 */
export class AHSSolver {
  /**
   * Solve a cube using IDA* with either an adaptive policy or fixed-order baseline.
   *
   * @param {Cube} inputCube - Cube instance or LogicalCube
   * @param {Object} options - Search options
   * @param {boolean} options.adaptive - Whether to enable adaptive move re-ordering (true) or fixed baseline (false)
   * @param {number} options.maxDepth - Maximum search depth (default 8)
   * @param {number} options.maxNodes - Maximum node evaluation threshold (default 200,000)
   * @param {number} options.timeoutMs - Maximum search time in ms (default 5,000 ms)
   * @returns {Object} Search and solution summary
   */
  static solve(inputCube, options = {}) {
    const tInit0 = performance.now();
    const initDurationMs = tablesInitialized ? 0 : initAHSTables();

    const {
      adaptive = true,
      maxDepth = 8,
      maxNodes = 200000,
      timeoutMs = 5000
    } = options;

    const rawCube = inputCube?.cube ? inputCube.cube : inputCube;
    if (!rawCube || typeof rawCube.clone !== 'function') {
      throw new Error('AHSSolver.solve requires a valid Cube instance');
    }

    // Work on an independent clone
    const workingCube = rawCube.clone();
    const tSolve0 = performance.now();

    let nodesEvaluated = 0;
    let heuristicsComputed = 0;

    // Check if already solved
    if (workingCube.isSolved()) {
      return {
        algorithm: 'Adaptive Heuristic Search (AHS)',
        policy: adaptive ? 'Adaptive Move Ordering' : 'Fixed-Order Policy',
        moves: [],
        moveString: '',
        totalMoves: 0,
        htm: 0,
        qtm: 0,
        nodesEvaluated: 0,
        heuristicsComputed: 1,
        pureSolveTimeMs: performance.now() - tSolve0,
        initDurationMs,
        validationTimeMs: 0,
        totalElapsedMs: (performance.now() - tSolve0) + initDurationMs,
        verified: true,
        isSolved: true,
        depthReached: 0,
        found: true,
        optimal: true,
        exhausted: false
      };
    }

    let threshold = calculateAdmissibleHeuristic(workingCube);
    heuristicsComputed++;

    let solution = null;
    let timedOut = false;
    let nodeLimitHit = false;

    // Iterative Deepening Loop
    while (threshold <= maxDepth) {
      let minNextThreshold = Infinity;

      function search(cube, g, prevMoveIdx, path) {
        nodesEvaluated++;
        if (performance.now() - tSolve0 > timeoutMs) {
          timedOut = true;
          return Infinity;
        }
        if (nodesEvaluated >= maxNodes) {
          nodeLimitHit = true;
          return Infinity;
        }

        const h = calculateAdmissibleHeuristic(cube);
        heuristicsComputed++;
        const f = g + h;

        if (f > threshold) {
          return f;
        }

        if (cube.isSolved()) {
          solution = [...path];
          return -1; // Solution found
        }

        const validIndices = STATIC_MOVE_INDICES.filter(m => !isRedundant(m, prevMoveIdx));

        if (adaptive) {
          // Dynamic Adaptive Strategy: Evaluate children heuristic distances and sort ascending
          const evaluatedChildren = validIndices.map(mIdx => {
            const nextCube = cube.clone();
            nextCube.move(MOVES[mIdx]);
            const nextH = calculateAdmissibleHeuristic(nextCube);
            heuristicsComputed++;
            return { mIdx, nextH, nextCube };
          });

          evaluatedChildren.sort((a, b) => a.nextH - b.nextH);

          for (const { mIdx, nextCube } of evaluatedChildren) {
            path.push(MOVES[mIdx]);
            const t = search(nextCube, g + 1, mIdx, path);
            path.pop();

            if (t === -1) return -1;
            if (t < minNextThreshold) minNextThreshold = t;
            if (timedOut || nodeLimitHit) return Infinity;
          }
        } else {
          // Fixed Policy: Expand children in fixed standard order
          for (const mIdx of validIndices) {
            const nextCube = cube.clone();
            nextCube.move(MOVES[mIdx]);
            path.push(MOVES[mIdx]);
            const t = search(nextCube, g + 1, mIdx, path);
            path.pop();

            if (t === -1) return -1;
            if (t < minNextThreshold) minNextThreshold = t;
            if (timedOut || nodeLimitHit) return Infinity;
          }
        }

        return minNextThreshold;
      }

      const status = search(workingCube, 0, -1, []);
      if (status === -1) break;
      if (status === Infinity || minNextThreshold === Infinity || timedOut || nodeLimitHit) break;
      threshold = minNextThreshold;
    }

    const tSolveEnd = performance.now();
    const pureSolveMs = tSolveEnd - tSolve0;

    // Independent validation on fresh clone of inputCube
    const tVal0 = performance.now();
    const valClone = rawCube.clone();
    if (solution && solution.length > 0) {
      valClone.move(solution.join(' '));
    }
    const isVerified = solution ? valClone.isSolved() : false;
    const valMs = performance.now() - tVal0;

    const totalElapsedMs = initDurationMs + pureSolveMs + valMs;

    const htm = solution ? solution.length : 0;
    let qtm = 0;
    if (solution) {
      for (const m of solution) qtm += m.includes('2') ? 2 : 1;
    }

    const depthExceeded = !solution && !timedOut && !nodeLimitHit && threshold > maxDepth;
    let limitationReason = null;
    if (!solution) {
      if (timedOut) limitationReason = `Search timed out after ${(timeoutMs/1000).toFixed(1)}s`;
      else if (nodeLimitHit) limitationReason = `Node budget limit reached (${maxNodes.toLocaleString()} nodes)`;
      else if (depthExceeded) limitationReason = `Search depth bound reached (maxDepth = ${maxDepth} HTM)`;
      else limitationReason = 'Search halted without solution';
    }

    return {
      algorithm: 'Adaptive Heuristic Search (AHS)',
      policy: adaptive ? 'Adaptive Move Ordering' : 'Fixed-Order Policy',
      moves: solution || [],
      moveString: solution ? solution.join(' ') : '',
      totalMoves: htm,
      htm,
      qtm,
      nodesEvaluated,
      heuristicsComputed,
      pureSolveTimeMs: pureSolveMs,
      initDurationMs,
      validationTimeMs: valMs,
      totalElapsedMs,
      verified: isVerified,
      isSolved: isVerified,
      depthReached: threshold,
      found: !!solution,
      optimal: !!solution, // Admissible heuristic ensures optimal path for solved state
      timedOut,
      nodeLimitHit,
      depthExceeded,
      limitations: limitationReason
    };
  }
}
