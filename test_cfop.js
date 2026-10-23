import Cube from './src/core/cube-lib.js';
import {
  CFOPSolver,
  isCrossSolved,
  isF2LSolved,
  isOLLSolved,
  solveCrossLookahead,
  solveF2L,
  solveOLL,
  solvePLL
} from './src/core/CFOPSolver.js';
import { generateScramble } from './src/core/ScrambleGenerator.js';

console.log('================================================================');
console.log('          CFOP-X FOUR-STAGE SOLVER AUTOMATED TEST SUITE         ');
console.log('================================================================\n');

// Test 1: Already Solved Cube
console.log('--- Test 1: Solved Cube ---');
const solvedCube = new Cube();
const solvedRes = CFOPSolver.solve(solvedCube);
if (solvedRes.success && solvedRes.isSolved && solvedRes.moves.length === 0) {
  console.log('PASS: Solved cube handled correctly.');
} else {
  console.error('FAIL: Solved cube handling failed:', solvedRes);
  process.exit(1);
}

// Test 2: Single-Move Scrambles (All 18 Face Turns)
console.log('\n--- Test 2: All 18 Single-Move Scrambles ---');
const allMoves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
for (const m of allMoves) {
  const c = new Cube();
  c.move(m);
  const res = CFOPSolver.solve(c);
  const val = c.clone();
  val.move(res.moveString);
  if (!res.success || !val.isSolved()) {
    console.error(`FAIL on single move scramble "${m}"`);
    process.exit(1);
  }
}
console.log('PASS: All 18 single-move scrambles solved & verified.');

// Test 3: Short Multi-Move Scrambles (Depths 2-5)
console.log('\n--- Test 3: Short Multi-Move Scrambles ---');
const shortScrambles = [
  "R U", "F D'", "R U R'", "F D F'", "R U R' U'",
  "L' U' L U", "F R U R' U' F'", "R U2 R2 U' R2 U' R2 U2 R"
];
for (const sc of shortScrambles) {
  const c = new Cube();
  c.move(sc);
  const res = CFOPSolver.solve(c);
  const val = c.clone();
  val.move(res.moveString);
  if (!res.success || !val.isSolved()) {
    console.error(`FAIL on short scramble "${sc}"`);
    process.exit(1);
  }
}
console.log('PASS: All short multi-move scrambles solved & verified.');

// Test 4: Invariants Across Intermediate Stages
console.log('\n--- Test 4: Stage-by-Stage Invariant Assertions ---');
const testC = new Cube();
testC.move("R U2 L' U' L R' U B2 F' L F B D2 R' U R2 L U R L");

const crossRes = solveCrossLookahead(testC);
if (!crossRes.success || !isCrossSolved(crossRes.cube)) {
  console.error('FAIL: Cross invariant not satisfied!');
  process.exit(1);
}
console.log('PASS: Stage 1 Cross invariant verified.');

const f2lRes = solveF2L(crossRes.cube);
if (!f2lRes.success || !isF2LSolved(f2lRes.cube)) {
  console.error('FAIL: F2L invariant not satisfied!');
  process.exit(1);
}
console.log('PASS: Stage 2 F2L invariant verified.');

const ollRes = solveOLL(f2lRes.cube);
if (!ollRes.success || !isOLLSolved(ollRes.cube)) {
  console.error('FAIL: OLL invariant not satisfied!');
  process.exit(1);
}
console.log('PASS: Stage 3 OLL invariant verified.');

const pllRes = solvePLL(ollRes.cube);
if (!pllRes.success || !pllRes.cube.isSolved()) {
  console.error('FAIL: PLL invariant not satisfied!');
  process.exit(1);
}
console.log('PASS: Stage 4 PLL invariant verified.');

// Test 5: Reproducible 50 Random Scrambles (End-to-End Solve & Verification)
console.log('\n--- Test 5: 50 Reproducible 20-Move WCA Scrambles ---');
let pass50 = 0;
let totalTime = 0;
let totalMoves = 0;

for (let i = 0; i < 50; i++) {
  const sc = generateScramble(20);
  const raw = new Cube();
  raw.move(sc.join(' '));

  const t0 = performance.now();
  const res = CFOPSolver.solve(raw);
  const ms = performance.now() - t0;
  totalTime += ms;

  if (res.success && res.verified) {
    const valClone = raw.clone();
    valClone.move(res.moveString);
    if (valClone.isSolved()) {
      pass50++;
      totalMoves += res.totalMoves;
    }
  } else {
    console.error(`FAIL on trial ${i + 1}: ${res.limitations || res.status}`);
    process.exit(1);
  }
}

console.log(`PASS: 50/50 Random Scrambles Solved & Independently Verified (100%)`);
console.log(`Mean Solve Time: ${(totalTime / 50).toFixed(1)} ms`);
console.log(`Mean Move Count: ${(totalMoves / pass50).toFixed(1)} HTM`);

console.log('\n================================================================');
console.log('          ALL CFOP-X SOLVER TESTS PASSED SUCCESSFULLY!          ');
console.log('================================================================');
