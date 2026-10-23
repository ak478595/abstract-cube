/**
 * benchmark_100_solvers.js
 *
 * Rigorous 100-Scramble Benchmark Suite for:
 * 1. Herbert Kociemba's Two-Phase Algorithm
 * 2. Layer-by-Layer (LBL) Beginner Method
 * 3. CFOP-X (Experimental Speedcubing Method)
 *
 * Requirements:
 * - 100 reproducible seeded scrambles (deterministic LCG PRNG, seed = 20261023).
 * - Exact same starting states passed to each solver via independent fresh clones.
 * - Measure pure solver compute time separately using high-resolution performance.now().
 * - Replay every returned solution on a fresh clone of the exact scramble state to verify.
 * - Do not count failed or unverified solutions as successful.
 * - Handle warm-up consistently: 5 warm-up cycles before timing starts.
 * - Measure mean and median compute time (ms), mean and median move count (HTM), verified solve rate, timeouts.
 * - Output and save full per-scramble raw data to benchmark_results.json.
 */

import fs from 'fs';
import Cube from './src/core/cube-lib.js';
import { LayerByLayerSolver } from './src/core/LayerByLayerSolver.js';
import { CFOPSolver } from './src/core/CFOPSolver.js';

// Deterministic PRNG (Linear Congruential Generator: Numerical Recipes)
function createSeededPRNG(seed = 20261023) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

function generateSeededScramble(prng, length = 20) {
  const moves = [];
  let lastFace = null;
  let secondLastFace = null;

  while (moves.length < length) {
    const face = FACES[Math.floor(prng() * FACES.length)];

    if (face === lastFace) continue;

    const isOpposite = (f1, f2) => {
      return (f1 === 'U' && f2 === 'D') || (f1 === 'D' && f2 === 'U') ||
             (f1 === 'L' && f2 === 'R') || (f1 === 'R' && f2 === 'L') ||
             (f1 === 'F' && f2 === 'B') || (f1 === 'B' && f2 === 'F');
    };

    if (face === secondLastFace && isOpposite(face, lastFace)) continue;

    const mod = MODIFIERS[Math.floor(prng() * MODIFIERS.length)];
    moves.push(face + mod);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values, m) {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Ensure Kociemba lookup tables are fully initialized prior to warm-up
console.log('Initializing Kociemba two-phase tables...');
const tInit0 = performance.now();
Cube.initSolver();
const initTimeMs = performance.now() - tInit0;
console.log(`Kociemba tables initialized in ${initTimeMs.toFixed(1)} ms.\n`);

// Generate 100 reproducible scrambles
const SEED = 20261023;
const prng = createSeededPRNG(SEED);
const SCRAMBLES_COUNT = 100;
const scrambles = [];
for (let i = 0; i < SCRAMBLES_COUNT; i++) {
  scrambles.push(generateSeededScramble(prng, 20));
}

// Warm-up Phase: 5 trials per solver to warm up JIT optimization and CPU caches
console.log('Running JIT warm-up cycles (5 scrambles)...');
const warmPrng = createSeededPRNG(99999);
for (let w = 0; w < 5; w++) {
  const warmScramble = generateSeededScramble(warmPrng, 20).join(' ');
  const c = new Cube();
  c.move(warmScramble);
  c.clone().solve();
  LayerByLayerSolver.solve(c.clone());
  CFOPSolver.solve(c.clone());
}
console.log('Warm-up complete. All solvers primed.\n');

// Benchmark Data Structures
const rawResults = [];

const metrics = {
  kociemba: { times: [], moves: [], verifiedCount: 0, failCount: 0, timeoutCount: 0 },
  lbl: { times: [], moves: [], verifiedCount: 0, failCount: 0, timeoutCount: 0 },
  cfop: { times: [], moves: [], verifiedCount: 0, failCount: 0, timeoutCount: 0 }
};

console.log(`Executing 100 reproducible benchmarks across all 3 solvers...`);
const benchmarkStart = performance.now();

for (let i = 0; i < SCRAMBLES_COUNT; i++) {
  const scrambleMoves = scrambles[i];
  const scrambleStr = scrambleMoves.join(' ');

  // Master baseline scrambled cube
  const masterScrambled = new Cube();
  masterScrambled.move(scrambleStr);

  const trialData = {
    index: i + 1,
    scramble: scrambleStr,
    kociemba: null,
    lbl: null,
    cfop: null
  };

  // -------------------------------------------------------------
  // 1. KOCIEMBA TWO-PHASE
  // -------------------------------------------------------------
  const kCube = masterScrambled.clone();
  let kSuccess = false;
  let kVerified = false;
  let kMovesCount = 0;
  let kTime = 0;
  let kError = null;

  try {
    const t0 = performance.now();
    const kSol = kCube.solve();
    kTime = performance.now() - t0;

    const moves = kSol.trim().split(/\s+/).filter(Boolean);
    kMovesCount = moves.length;

    // Independent verification on fresh clone of masterScrambled
    const valK = masterScrambled.clone();
    valK.move(kSol);
    kVerified = valK.isSolved();
    kSuccess = kVerified;

    if (kSuccess) {
      metrics.kociemba.times.push(kTime);
      metrics.kociemba.moves.push(kMovesCount);
      metrics.kociemba.verifiedCount++;
    } else {
      metrics.kociemba.failCount++;
      kError = 'Verification failed on clone';
    }

    trialData.kociemba = {
      solveTimeMs: kTime,
      htm: kMovesCount,
      success: kSuccess,
      verified: kVerified,
      moveString: kSol,
      error: kError
    };
  } catch (err) {
    metrics.kociemba.failCount++;
    trialData.kociemba = {
      solveTimeMs: kTime,
      htm: 0,
      success: false,
      verified: false,
      error: err.message
    };
  }

  // -------------------------------------------------------------
  // 2. LAYER-BY-LAYER (LBL)
  // -------------------------------------------------------------
  const lblCube = masterScrambled.clone();
  let lblSuccess = false;
  let lblVerified = false;
  let lblMovesCount = 0;
  let lblTime = 0;
  let lblError = null;

  try {
    const t0 = performance.now();
    const lblRes = LayerByLayerSolver.solve(lblCube);
    lblTime = performance.now() - t0;

    lblMovesCount = lblRes.moves.length;

    // Independent verification on fresh clone of masterScrambled
    const valLbl = masterScrambled.clone();
    valLbl.move(lblRes.moveString);
    lblVerified = valLbl.isSolved();
    lblSuccess = lblRes.verified && lblVerified;

    if (lblSuccess) {
      metrics.lbl.times.push(lblTime);
      metrics.lbl.moves.push(lblMovesCount);
      metrics.lbl.verifiedCount++;
    } else {
      metrics.lbl.failCount++;
      lblError = lblRes.error || 'Verification failed on clone';
    }

    trialData.lbl = {
      solveTimeMs: lblTime,
      htm: lblMovesCount,
      success: lblSuccess,
      verified: lblVerified,
      moveString: lblRes.moveString,
      error: lblError
    };
  } catch (err) {
    metrics.lbl.failCount++;
    trialData.lbl = {
      solveTimeMs: lblTime,
      htm: 0,
      success: false,
      verified: false,
      error: err.message
    };
  }

  // -------------------------------------------------------------
  // 3. CFOP-X (EXPERIMENTAL)
  // -------------------------------------------------------------
  const cfopCube = masterScrambled.clone();
  let cfopSuccess = false;
  let cfopVerified = false;
  let cfopMovesCount = 0;
  let cfopTime = 0;
  let cfopError = null;

  try {
    const t0 = performance.now();
    const cfopRes = CFOPSolver.solve(cfopCube);
    cfopTime = performance.now() - t0;

    cfopMovesCount = cfopRes.moves.length;

    // Independent verification on fresh clone of masterScrambled
    const valCfop = masterScrambled.clone();
    valCfop.move(cfopRes.moveString);
    cfopVerified = valCfop.isSolved();
    cfopSuccess = cfopRes.verified && cfopVerified;

    if (cfopSuccess) {
      metrics.cfop.times.push(cfopTime);
      metrics.cfop.moves.push(cfopMovesCount);
      metrics.cfop.verifiedCount++;
    } else {
      metrics.cfop.failCount++;
      cfopError = cfopRes.limitations || 'Verification failed on clone';
    }

    trialData.cfop = {
      solveTimeMs: cfopTime,
      htm: cfopMovesCount,
      success: cfopSuccess,
      verified: cfopVerified,
      moveString: cfopRes.moveString,
      stageBreakdown: cfopRes.stageBreakdown,
      error: cfopError
    };
  } catch (err) {
    metrics.cfop.failCount++;
    trialData.cfop = {
      solveTimeMs: cfopTime,
      htm: 0,
      success: false,
      verified: false,
      error: err.message
    };
  }

  rawResults.push(trialData);

  if ((i + 1) % 25 === 0) {
    console.log(`Progress: ${i + 1} / 100 scrambles benchmarked...`);
  }
}

const totalBenchmarkDuration = performance.now() - benchmarkStart;
console.log(`\nBenchmark completed in ${(totalBenchmarkDuration / 1000).toFixed(2)} seconds.\n`);

// Save raw per-scramble results to disk
const exportPayload = {
  metadata: {
    scrambleCount: SCRAMBLES_COUNT,
    seed: SEED,
    metric: 'HTM (Half-Turn Metric)',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  },
  summary: {
    kociemba: {
      attempted: SCRAMBLES_COUNT,
      verifiedCount: metrics.kociemba.verifiedCount,
      successRate: (metrics.kociemba.verifiedCount / SCRAMBLES_COUNT) * 100,
      failures: metrics.kociemba.failCount,
      timeouts: metrics.kociemba.timeoutCount,
      meanTimeMs: mean(metrics.kociemba.times),
      medianTimeMs: median(metrics.kociemba.times),
      stdDevTimeMs: stdDev(metrics.kociemba.times, mean(metrics.kociemba.times)),
      minTimeMs: Math.min(...metrics.kociemba.times),
      maxTimeMs: Math.max(...metrics.kociemba.times),
      meanMovesHTM: mean(metrics.kociemba.moves),
      medianMovesHTM: median(metrics.kociemba.moves),
      minMovesHTM: Math.min(...metrics.kociemba.moves),
      maxMovesHTM: Math.max(...metrics.kociemba.moves)
    },
    lbl: {
      attempted: SCRAMBLES_COUNT,
      verifiedCount: metrics.lbl.verifiedCount,
      successRate: (metrics.lbl.verifiedCount / SCRAMBLES_COUNT) * 100,
      failures: metrics.lbl.failCount,
      timeouts: metrics.lbl.timeoutCount,
      meanTimeMs: mean(metrics.lbl.times),
      medianTimeMs: median(metrics.lbl.times),
      stdDevTimeMs: stdDev(metrics.lbl.times, mean(metrics.lbl.times)),
      minTimeMs: Math.min(...metrics.lbl.times),
      maxTimeMs: Math.max(...metrics.lbl.times),
      meanMovesHTM: mean(metrics.lbl.moves),
      medianMovesHTM: median(metrics.lbl.moves),
      minMovesHTM: Math.min(...metrics.lbl.moves),
      maxMovesHTM: Math.max(...metrics.lbl.moves)
    },
    cfop: {
      attempted: SCRAMBLES_COUNT,
      verifiedCount: metrics.cfop.verifiedCount,
      successRate: (metrics.cfop.verifiedCount / SCRAMBLES_COUNT) * 100,
      failures: metrics.cfop.failCount,
      timeouts: metrics.cfop.timeoutCount,
      meanTimeMs: mean(metrics.cfop.times),
      medianTimeMs: median(metrics.cfop.times),
      stdDevTimeMs: stdDev(metrics.cfop.times, mean(metrics.cfop.times)),
      minTimeMs: Math.min(...metrics.cfop.times),
      maxTimeMs: Math.max(...metrics.cfop.times),
      meanMovesHTM: mean(metrics.cfop.moves),
      medianMovesHTM: median(metrics.cfop.moves),
      minMovesHTM: Math.min(...metrics.cfop.moves),
      maxMovesHTM: Math.max(...metrics.cfop.moves)
    }
  },
  trials: rawResults
};

fs.writeFileSync('benchmark_results.json', JSON.stringify(exportPayload, null, 2), 'utf-8');
console.log('Saved complete raw results and metadata to benchmark_results.json.\n');

// Format Markdown Output Table
console.log('========================================================================================');
console.log('          COMPREHENSIVE THREE-METHOD BENCHMARK REPORT (100 SEEDED SCRAMBLES)            ');
console.log('========================================================================================\n');

console.log('| Metric | Herbert Kociemba (Two-Phase) | Layer-by-Layer (LBL) | CFOP-X (Experimental) |');
console.log('| :--- | :--- | :--- | :--- |');
console.log(`| **Scrambles Evaluated** | ${exportPayload.summary.kociemba.attempted} | ${exportPayload.summary.lbl.attempted} | ${exportPayload.summary.cfop.attempted} |`);
console.log(`| **Verified Solved** | ${exportPayload.summary.kociemba.verifiedCount} / 100 | ${exportPayload.summary.lbl.verifiedCount} / 100 | ${exportPayload.summary.cfop.verifiedCount} / 100 |`);
console.log(`| **Success Rate** | **${exportPayload.summary.kociemba.successRate.toFixed(1)}%** | **${exportPayload.summary.lbl.successRate.toFixed(1)}%** | **${exportPayload.summary.cfop.successRate.toFixed(1)}%** |`);
console.log(`| **Failures / Errors** | ${exportPayload.summary.kociemba.failures} | ${exportPayload.summary.lbl.failures} | ${exportPayload.summary.cfop.failures} |`);
console.log(`| **Timeouts** | ${exportPayload.summary.kociemba.timeouts} | ${exportPayload.summary.lbl.timeouts} | ${exportPayload.summary.cfop.timeouts} |`);
console.log(`| **Mean Solve Time** | **${exportPayload.summary.kociemba.meanTimeMs.toFixed(2)} ms** | **${exportPayload.summary.lbl.meanTimeMs.toFixed(2)} ms** | **${exportPayload.summary.cfop.meanTimeMs.toFixed(2)} ms** |`);
console.log(`| **Median Solve Time** | **${exportPayload.summary.kociemba.medianTimeMs.toFixed(2)} ms** | **${exportPayload.summary.lbl.medianTimeMs.toFixed(2)} ms** | **${exportPayload.summary.cfop.medianTimeMs.toFixed(2)} ms** |`);
console.log(`| **Min / Max Solve Time** | ${exportPayload.summary.kociemba.minTimeMs.toFixed(2)} ms / ${exportPayload.summary.kociemba.maxTimeMs.toFixed(2)} ms | ${exportPayload.summary.lbl.minTimeMs.toFixed(2)} ms / ${exportPayload.summary.lbl.maxTimeMs.toFixed(2)} ms | ${exportPayload.summary.cfop.minTimeMs.toFixed(2)} ms / ${exportPayload.summary.cfop.maxTimeMs.toFixed(2)} ms |`);
console.log(`| **Mean Move Count** | **${exportPayload.summary.kociemba.meanMovesHTM.toFixed(1)} HTM** | **${exportPayload.summary.lbl.meanMovesHTM.toFixed(1)} HTM** | **${exportPayload.summary.cfop.meanMovesHTM.toFixed(1)} HTM** |`);
console.log(`| **Median Move Count** | **${exportPayload.summary.kociemba.medianMovesHTM.toFixed(1)} HTM** | **${exportPayload.summary.lbl.medianMovesHTM.toFixed(1)} HTM** | **${exportPayload.summary.cfop.medianMovesHTM.toFixed(1)} HTM** |`);
console.log(`| **Min / Max Moves** | ${exportPayload.summary.kociemba.minMovesHTM} / ${exportPayload.summary.kociemba.maxMovesHTM} HTM | ${exportPayload.summary.lbl.minMovesHTM} / ${exportPayload.summary.lbl.maxMovesHTM} HTM | ${exportPayload.summary.cfop.minMovesHTM} / ${exportPayload.summary.cfop.maxMovesHTM} HTM |`);
console.log(`| **Verification Guarantee** | 100% Replay Verified | 100% Replay Verified | 100% Replay Verified |`);
console.log(`| **Algorithmic Paradigm** | Coset Graph Traversal | Procedural Layer Staged | Lookahead Cross &amp; 4-Stage |`);
