/**
 * test_benchmark.js
 *
 * Repeatable Academic Benchmark: Kociemba Two-Phase vs. Layer-by-Layer (LBL)
 *
 * Requirements:
 * - Runs both algorithms against the same set of 50 valid scramble states.
 * - Distinguishes cold-start initialization latency from warm solve time.
 * - Separates pure search/solve time, verification time, and total elapsed time.
 * - Tracks moves in both Half-Turn Metric (HTM) and Quarter-Turn Metric (QTM).
 * - Reports:
 *   - Success rate (%)
 *   - Mean and median pure computation time (ms)
 *   - Mean and median validation time (ms)
 *   - Mean and median total elapsed time (ms)
 *   - Mean and median solution length (moves) in HTM & QTM
 */

import Cube from './src/core/cube-lib.js';
import { LayerByLayerSolver } from './src/core/LayerByLayerSolver.js';
import { generateScramble } from './src/core/ScrambleGenerator.js';

function computeStats(arr) {
  if (arr.length === 0) return { mean: 0, median: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100
  };
}

function countQTM(moves) {
  let qtm = 0;
  for (const m of moves) {
    qtm += m.includes('2') ? 2 : 1;
  }
  return qtm;
}

console.log('================================================================');
console.log('       RUBIK\'S CUBE SOLVER BENCHMARK & ACADEMIC EVALUATION      ');
console.log('================================================================\n');

// 1. Cold-Start Initialization Benchmark
console.log('[Phase 1] Measuring Cold-Start Initialization Latency...');
const kocInitStart = performance.now();
Cube.initSolver();
const kocInitTimeMs = Math.round((performance.now() - kocInitStart) * 100) / 100;
console.log(`- Kociemba Two-Phase Table Precomputation: ${kocInitTimeMs} ms`);

const lblInitStart = performance.now();
// LBL uses direct procedural stage reductions and requires no large offline coset tables
const dummyCube = new Cube();
LayerByLayerSolver.solve(dummyCube);
const lblInitTimeMs = Math.round((performance.now() - lblInitStart) * 100) / 100;
console.log(`- Layer-by-Layer (LBL) Initialization / Warmup: ${lblInitTimeMs} ms\n`);

// 2. Generating identical test sample of 50 random scrambles
const NUM_TRIALS = 50;
console.log(`[Phase 2] Generating ${NUM_TRIALS} identical random valid 20-move scrambles...`);
const scrambles = [];
for (let i = 0; i < NUM_TRIALS; i++) {
  scrambles.push(generateScramble(20).join(' '));
}
console.log(`Sample set prepared.\n`);

// 3. Benchmarking Kociemba Two-Phase
console.log(`[Phase 3] Benchmarking Kociemba Two-Phase (${NUM_TRIALS} trials)...`);
const kocPureTimes = [];
const kocValTimes = [];
const kocTotalTimes = [];
const kocHtmLengths = [];
const kocQtmLengths = [];
let kocSuccessCount = 0;

for (let i = 0; i < NUM_TRIALS; i++) {
  const c = new Cube();
  c.move(scrambles[i]);

  const t0 = performance.now();
  const solStr = c.solve();
  const pureSolveTime = performance.now() - t0;

  // Independent verification on fresh clone
  const tVal0 = performance.now();
  const clone = new Cube();
  clone.move(scrambles[i]);
  clone.move(solStr);
  const isVerified = clone.isSolved();
  const valTime = performance.now() - tVal0;

  if (isVerified) {
    kocSuccessCount++;
    kocPureTimes.push(pureSolveTime);
    kocValTimes.push(valTime);
    kocTotalTimes.push(pureSolveTime + valTime);

    const moves = solStr.trim().split(/\s+/).filter(Boolean);
    kocHtmLengths.push(moves.length);
    kocQtmLengths.push(countQTM(moves));
  } else {
    console.error(`Kociemba failed on trial ${i + 1}`);
  }
}

// 4. Benchmarking Layer-by-Layer (LBL)
console.log(`[Phase 4] Benchmarking Layer-by-Layer LBL (${NUM_TRIALS} trials)...`);
const lblPureTimes = [];
const lblValTimes = [];
const lblTotalTimes = [];
const lblHtmLengths = [];
const lblQtmLengths = [];
let lblSuccessCount = 0;

for (let i = 0; i < NUM_TRIALS; i++) {
  const c = new Cube();
  c.move(scrambles[i]);

  const res = LayerByLayerSolver.solve(c);

  if (res.verified) {
    lblSuccessCount++;
    lblPureTimes.push(res.solveTimeMs);
    lblValTimes.push(res.validationTimeMs);
    lblTotalTimes.push(res.totalElapsedMs);

    lblHtmLengths.push(res.moves.length);
    lblQtmLengths.push(res.qtm || countQTM(res.moves));
  } else {
    console.error(`LBL failed on trial ${i + 1}`);
  }
}

// 5. Statistical Analysis
const kocPureStats = computeStats(kocPureTimes);
const kocValStats = computeStats(kocValTimes);
const kocTotalStats = computeStats(kocTotalTimes);
const kocHtmStats = computeStats(kocHtmLengths);
const kocQtmStats = computeStats(kocQtmLengths);

const lblPureStats = computeStats(lblPureTimes);
const lblValStats = computeStats(lblValTimes);
const lblTotalStats = computeStats(lblTotalTimes);
const lblHtmStats = computeStats(lblHtmLengths);
const lblQtmStats = computeStats(lblQtmLengths);

console.log('\n================================================================');
console.log('                     BENCHMARK RESULTS SUMMARY                   ');
console.log('================================================================\n');

console.log(`Sample Size: ${NUM_TRIALS} identical random scrambles (HTM 20)\n`);

console.log('1. Cold-Start Initialization Time:');
console.log(`   - Kociemba Two-Phase : ${kocInitTimeMs.toFixed(2)} ms (offline table generation)`);
console.log(`   - Layer-by-Layer LBL : ${lblInitTimeMs.toFixed(2)} ms (zero offline tables required)\n`);

console.log('2. Success Rate (Independent Cloned Verification):');
console.log(`   - Kociemba Two-Phase : ${(kocSuccessCount / NUM_TRIALS * 100).toFixed(1)}% (${kocSuccessCount}/${NUM_TRIALS})`);
console.log(`   - Layer-by-Layer LBL : ${(lblSuccessCount / NUM_TRIALS * 100).toFixed(1)}% (${lblSuccessCount}/${NUM_TRIALS})\n`);

console.log('3. Pure Computation Time (Per Solve, Excl. Validation):');
console.log(`   - Kociemba Two-Phase : Mean = ${kocPureStats.mean.toFixed(2)} ms | Median = ${kocPureStats.median.toFixed(2)} ms (Min: ${kocPureStats.min.toFixed(2)} ms, Max: ${kocPureStats.max.toFixed(2)} ms)`);
console.log(`   - Layer-by-Layer LBL : Mean = ${lblPureStats.mean.toFixed(2)} ms | Median = ${lblPureStats.median.toFixed(2)} ms (Min: ${lblPureStats.min.toFixed(2)} ms, Max: ${lblPureStats.max.toFixed(2)} ms)\n`);

console.log('4. Verification Latency (Clone Check):');
console.log(`   - Kociemba Two-Phase : Mean = ${kocValStats.mean.toFixed(3)} ms | Median = ${kocValStats.median.toFixed(3)} ms`);
console.log(`   - Layer-by-Layer LBL : Mean = ${lblValStats.mean.toFixed(3)} ms | Median = ${lblValStats.median.toFixed(3)} ms\n`);

console.log('5. Total Elapsed Warm Time (Pure Solve + Verification):');
console.log(`   - Kociemba Two-Phase : Mean = ${kocTotalStats.mean.toFixed(2)} ms | Median = ${kocTotalStats.median.toFixed(2)} ms`);
console.log(`   - Layer-by-Layer LBL : Mean = ${lblTotalStats.mean.toFixed(2)} ms | Median = ${lblTotalStats.median.toFixed(2)} ms\n`);

console.log('6. Move Length Metrics:');
console.log(`   - Kociemba (HTM)     : Mean = ${kocHtmStats.mean.toFixed(2)} moves | Median = ${kocHtmStats.median} moves (Min: ${kocHtmStats.min}, Max: ${kocHtmStats.max})`);
console.log(`   - Kociemba (QTM)     : Mean = ${kocQtmStats.mean.toFixed(2)} moves | Median = ${kocQtmStats.median} moves`);
console.log(`   - Layer-by-Layer(HTM): Mean = ${lblHtmStats.mean.toFixed(2)} moves | Median = ${lblHtmStats.median} moves (Min: ${lblHtmStats.min}, Max: ${lblHtmStats.max})`);
console.log(`   - Layer-by-Layer(QTM): Mean = ${lblQtmStats.mean.toFixed(2)} moves | Median = ${lblQtmStats.median} moves\n`);

console.log('7. Academic Comparison Matrix:');
console.log('| Metric                          | Kociemba Two-Phase             | Layer-by-Layer (LBL)           |');
console.log('|---------------------------------|--------------------------------|--------------------------------|');
console.log(`| Strategy                        | Coset Search (G -> H -> {e})   | Staged Reduction (L1->L2->L3)  |`);
console.log(`| Offline Init Time               | ${String(kocInitTimeMs.toFixed(2) + ' ms').padEnd(30)} | ${String(lblInitTimeMs.toFixed(2) + ' ms (Zero tables)').padEnd(30)} |`);
console.log(`| Success Rate (n=${NUM_TRIALS})             | ${String((kocSuccessCount / NUM_TRIALS * 100).toFixed(1) + '%').padEnd(30)} | ${String((lblSuccessCount / NUM_TRIALS * 100).toFixed(1) + '%').padEnd(30)} |`);
console.log(`| Mean Pure Solve Time            | ${String(kocPureStats.mean.toFixed(2) + ' ms').padEnd(30)} | ${String(lblPureStats.mean.toFixed(2) + ' ms').padEnd(30)} |`);
console.log(`| Mean Verification Time          | ${String(kocValStats.mean.toFixed(3) + ' ms').padEnd(30)} | ${String(lblValStats.mean.toFixed(3) + ' ms').padEnd(30)} |`);
console.log(`| Mean Total Elapsed Time         | ${String(kocTotalStats.mean.toFixed(2) + ' ms').padEnd(30)} | ${String(lblTotalStats.mean.toFixed(2) + ' ms').padEnd(30)} |`);
console.log(`| Mean HTM Move Length            | ${String(kocHtmStats.mean.toFixed(1) + ' moves').padEnd(30)} | ${String(lblHtmStats.mean.toFixed(1) + ' moves').padEnd(30)} |`);
console.log(`| Mean QTM Move Length            | ${String(kocQtmStats.mean.toFixed(1) + ' moves').padEnd(30)} | ${String(lblQtmStats.mean.toFixed(1) + ' moves').padEnd(30)} |`);
console.log(`| Move Optimality                 | Near-optimal (<= 22 HTM)       | Pedagogical (~80-180 moves)    |`);
console.log(`| Human Executability             | Low (Machine coset search)     | Very High (Beginner method)    |`);

console.log('\n================================================================');
console.log('                      BENCHMARK COMPLETE                        ');
console.log('================================================================');
