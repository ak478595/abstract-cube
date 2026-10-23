/**
 * test_solvers.js
 * Comprehensive automated test suite for Rubik's Cube Solvers:
 * - Kociemba Two-Phase Algorithm
 * - Layer-by-Layer (LBL) Beginner Method
 *
 * Verifies:
 * 1. Already-solved cube
 * 2. Single-move scrambles (all 18 standard turns)
 * 3. Short multi-move scrambles (3, 5, 8 moves)
 * 4. Random 20-move valid scrambles (25 trials)
 * 5. LBL intermediate stage-completion invariants:
 *    - Stage 1: White Cross
 *    - Stage 2: First-Layer Corners (First Layer Complete)
 *    - Stage 3: Middle-Layer Edges (F2L Complete)
 *    - Stage 4: Last Layer (Cube Complete)
 * 6. Error handling / rejection of invalid inputs
 * 7. LogicalCube API integration (solve() & solveLBL())
 */

import Cube from './src/core/cube-lib.js';
import { LogicalCube } from './src/core/LogicalCube.js';
import { LayerByLayerSolver } from './src/core/LayerByLayerSolver.js';
import { generateScramble } from './src/core/ScrambleGenerator.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
}

console.log('======================================================');
console.log('   AUTOMATED SOLVER TEST SUITE (Kociemba & LBL)       ');
console.log('======================================================\n');

// Initialize Kociemba solver tables
console.log('Initializing Kociemba solver tables...');
await LogicalCube.ensureSolver();
console.log('Initialization complete.\n');

// --------------------------------------------------------------------------
// TEST 1: Already-Solved Cube
// --------------------------------------------------------------------------
console.log('--- Test 1: Already-Solved Cube ---');
{
  const lc = new LogicalCube();
  assert(lc.isSolved(), 'Initial LogicalCube must be solved');

  // Kociemba
  const kocSol = lc.solve();
  assert(kocSol === '', `Kociemba should return empty string for solved cube, got: "${kocSol}"`);

  // LBL
  const lblRes = LayerByLayerSolver.solve(lc);
  assert(lblRes.isSolved, 'LBL result should report isSolved=true');
  assert(lblRes.moves.length === 0, `LBL moves should be empty for solved cube, got length ${lblRes.moves.length}`);
  assert(lblRes.verified, 'LBL verified should be true');

  const lblStr = lc.solveLBL();
  assert(lblStr === '', `LogicalCube.solveLBL() should return empty string, got: "${lblStr}"`);

  console.log('✓ PASS: Already-solved cube handled correctly by both solvers.\n');
}

// --------------------------------------------------------------------------
// TEST 2: Single-Move Scrambles (All 18 Standard Face Turns)
// --------------------------------------------------------------------------
console.log('--- Test 2: Single-Move Scrambles (18 Face Turns) ---');
{
  const ALL_MOVES = [
    'U', "U'", 'U2', 'D', "D'", 'D2',
    'L', "L'", 'L2', 'R', "R'", 'R2',
    'F', "F'", 'F2', 'B', "B'", 'B2'
  ];

  for (const move of ALL_MOVES) {
    // Kociemba test
    const lcKoc = new LogicalCube();
    lcKoc.applyMove(move);
    assert(!lcKoc.isSolved(), `Cube after ${move} must not be solved`);
    const kocSol = lcKoc.solve();
    const kocClone = lcKoc.clone();
    kocClone.applyAlgorithm(kocSol);
    assert(kocClone.isSolved(), `Kociemba solution failed to solve single move: ${move}`);

    // LBL test
    const lcLbl = new LogicalCube();
    lcLbl.applyMove(move);
    const lblRes = LayerByLayerSolver.solve(lcLbl);
    assert(lblRes.verified, `LBL failed to verify single move: ${move}`);
    const lblClone = lcLbl.clone();
    lblClone.applyAlgorithm(lblRes.moveString);
    assert(lblClone.isSolved(), `LBL solution failed to solve single move: ${move}`);
  }

  console.log(`✓ PASS: All 18 single-move scrambles solved & verified by both solvers.\n`);
}

// --------------------------------------------------------------------------
// TEST 3: Short Multi-Move Scrambles (3, 5, 8 Moves)
// --------------------------------------------------------------------------
console.log('--- Test 3: Short Multi-Move Scrambles ---');
{
  const shortScrambles = [
    "R U R'",
    "F R U R' U' F'",
    "R U R' U R U2 R'",
    "R2 U2 R2 U2 R2 U2",
    "U D R L F B U D"
  ];

  for (const sc of shortScrambles) {
    // Kociemba
    const lcKoc = new LogicalCube();
    lcKoc.applyAlgorithm(sc);
    const kocSol = lcKoc.solve();
    const kocClone = lcKoc.clone();
    kocClone.applyAlgorithm(kocSol);
    assert(kocClone.isSolved(), `Kociemba failed on short scramble: "${sc}"`);

    // LBL
    const lcLbl = new LogicalCube();
    lcLbl.applyAlgorithm(sc);
    const lblRes = LayerByLayerSolver.solve(lcLbl);
    assert(lblRes.verified, `LBL failed verification on short scramble: "${sc}"`);
    const lblClone = lcLbl.clone();
    lblClone.applyAlgorithm(lblRes.moveString);
    assert(lblClone.isSolved(), `LBL failed to solve short scramble: "${sc}"`);
  }

  console.log(`✓ PASS: All short multi-move scrambles solved & verified.\n`);
}

// --------------------------------------------------------------------------
// TEST 4: Random 20-Move Scrambles (25 Trials)
// --------------------------------------------------------------------------
console.log('--- Test 4: Random 20-Move Scrambles (25 Trials) ---');
{
  for (let i = 1; i <= 25; i++) {
    const scramble = generateScramble(20).join(' ');

    // Kociemba
    const lcKoc = new LogicalCube();
    lcKoc.applyAlgorithm(scramble);
    const kocSol = lcKoc.solve();
    const kocClone = lcKoc.clone();
    kocClone.applyAlgorithm(kocSol);
    assert(kocClone.isSolved(), `Kociemba failed on random scramble #${i}`);

    // LBL
    const lcLbl = new LogicalCube();
    lcLbl.applyAlgorithm(scramble);
    const lblRes = LayerByLayerSolver.solve(lcLbl);
    assert(lblRes.verified, `LBL reported verified=false on scramble #${i}`);
    const lblClone = lcLbl.clone();
    lblClone.applyAlgorithm(lblRes.moveString);
    assert(lblClone.isSolved(), `LBL failed to reach solved state on scramble #${i}`);
  }

  console.log(`✓ PASS: 25/25 random 20-move scrambles solved & verified by both solvers.\n`);
}

// --------------------------------------------------------------------------
// TEST 5: LBL Intermediate Stage-Completion Invariants
// --------------------------------------------------------------------------
console.log('--- Test 5: LBL Intermediate Stage Invariants ---');
{
  for (let i = 1; i <= 10; i++) {
    const scramble = generateScramble(20).join(' ');
    const cube = new Cube();
    cube.move(scramble);

    const stages = [];
    const allMoves = [];
    function record(alg) {
      if (!alg) return;
      for (const m of alg.trim().split(/\s+/).filter(Boolean)) {
        cube.move(m);
        allMoves.push(m);
      }
    }

    // Stage 1
    import('./src/core/LayerByLayerSolver.js').then();
    const {
      solveFirstLayerCross,
      solveFirstLayerCorners,
      solveMiddleLayer,
      orientLastLayerEdges,
      permuteLastLayerEdges,
      permuteLastLayerCorners,
      orientLastLayerCorners
    } = await import('./src/core/LayerByLayerSolver.js');

    // Stage 1: White Cross
    solveFirstLayerCross(cube, record);
    const crossDone = [0, 1, 2, 3].every(id => cube.ep[id] === id && cube.eo[id] === 0);
    assert(crossDone, `Trial #${i}: Stage 1 Cross must be solved`);

    // Stage 2: First-Layer Corners
    solveFirstLayerCorners(cube, record);
    const crossStillDone = [0, 1, 2, 3].every(id => cube.ep[id] === id && cube.eo[id] === 0);
    const cornersDone = [0, 1, 2, 3].every(id => cube.cp[id] === id && cube.co[id] === 0);
    assert(crossStillDone && cornersDone, `Trial #${i}: Stage 2 First Layer must be completely solved`);

    // Stage 3: Middle-Layer Edges
    solveMiddleLayer(cube, record);
    const f2lDone = [0, 1, 2, 3].every(id => cube.ep[id] === id && cube.eo[id] === 0) &&
                    [0, 1, 2, 3].every(id => cube.cp[id] === id && cube.co[id] === 0) &&
                    [8, 9, 10, 11].every(id => cube.ep[id] === id && cube.eo[id] === 0);
    assert(f2lDone, `Trial #${i}: Stage 3 F2L must be completely solved`);

    // Stage 4: Last Layer
    orientLastLayerEdges(cube, record);
    const lastEdgesOriented = [4, 5, 6, 7].every(id => cube.eo[id] === 0);
    assert(lastEdgesOriented, `Trial #${i}: Stage 4.1 Last Layer edges must be oriented`);

    permuteLastLayerEdges(cube, record);
    const lastEdgesPermuted = [4, 5, 6, 7].every(id => cube.ep[id] === id && cube.eo[id] === 0);
    assert(lastEdgesPermuted, `Trial #${i}: Stage 4.2 Last Layer edges must be permuted`);

    permuteLastLayerCorners(cube, record);
    const lastCornersPermuted = [4, 5, 6, 7].every(id => cube.cp[id] === id);
    assert(lastCornersPermuted, `Trial #${i}: Stage 4.3 Last Layer corners must be permuted`);

    orientLastLayerCorners(cube, record);
    const lastCornersOriented = [4, 5, 6, 7].every(id => cube.co[id] === 0);
    assert(lastCornersOriented, `Trial #${i}: Stage 4.4 Last Layer corners must be oriented`);

    // Final alignment
    for (const d of ['', 'D', 'D2', "D'"]) {
      const t = cube.clone();
      if (d) t.move(d);
      if (t.isSolved()) {
        if (d) record(d);
        break;
      }
    }
    assert(cube.isSolved(), `Trial #${i}: Cube must be completely solved at end of Stage 4`);
  }

  console.log(`✓ PASS: 10/10 trials satisfied all intermediate stage invariants independently.\n`);
}

// --------------------------------------------------------------------------
// TEST 6: Error Handling & Invalid Inputs
// --------------------------------------------------------------------------
console.log('--- Test 6: Error Handling & Invalid Inputs ---');
{
  let threwNull = false;
  try {
    LayerByLayerSolver.solve(null);
  } catch (e) {
    threwNull = true;
  }
  assert(threwNull, 'LayerByLayerSolver.solve(null) should throw an error');

  let threwEmpty = false;
  try {
    LayerByLayerSolver.solve({});
  } catch (e) {
    threwEmpty = true;
  }
  assert(threwEmpty, 'LayerByLayerSolver.solve({}) should throw an error');

  console.log('✓ PASS: Invalid inputs rejected properly.\n');
}

// --------------------------------------------------------------------------
// TEST 7: LogicalCube API Integration
// --------------------------------------------------------------------------
console.log('--- Test 7: LogicalCube API Integration ---');
{
  const lc = new LogicalCube();
  lc.applyAlgorithm("R U R' U'");
  assert(typeof lc.solve === 'function', 'LogicalCube.prototype.solve must exist');
  assert(typeof lc.solveLBL === 'function', 'LogicalCube.prototype.solveLBL must exist');

  const kocStr = lc.solve();
  const lblStr = lc.solveLBL();

  assert(typeof kocStr === 'string' && kocStr.length > 0, 'lc.solve() should return non-empty string');
  assert(typeof lblStr === 'string' && lblStr.length > 0, 'lc.solveLBL() should return non-empty string');

  const cKoc = lc.clone();
  cKoc.applyAlgorithm(kocStr);
  assert(cKoc.isSolved(), 'Applying lc.solve() string must solve the cube');

  const cLbl = lc.clone();
  cLbl.applyAlgorithm(lblStr);
  assert(cLbl.isSolved(), 'Applying lc.solveLBL() string must solve the cube');

  console.log('✓ PASS: LogicalCube methods solve() and solveLBL() work seamlessly.\n');
}

console.log('======================================================');
console.log(`   ALL TESTS PASSED! (${passedTests} / ${totalTests} assertions)   `);
console.log('======================================================');
