import { LogicalCube } from './src/core/LogicalCube.js';
import { generateScramble } from './src/core/ScrambleGenerator.js';

console.log('=== RUNNING SCRAMBLE PLAYBACK & ENGINE REGRESSION TESTS ===\n');

// 1. Verify scramble generation adheres to WCA 20-move format and avoids redundant consecutive turns
const scramble = generateScramble(20);
console.log('Generated scramble:', scramble);
if (scramble.length !== 20) {
  console.error(`FAIL: Scramble length expected 20, got ${scramble.length}`);
  process.exit(1);
}

for (let i = 1; i < scramble.length; i++) {
  const f1 = scramble[i - 1][0];
  const f2 = scramble[i][0];
  if (f1 === f2) {
    console.error(`FAIL: Redundant adjacent face turn detected: ${scramble[i - 1]} followed by ${scramble[i]}`);
    process.exit(1);
  }
}
console.log('PASS: Scramble sequence avoids consecutive turns on same face.');

// 2. Sequential step vs batch application equivalence
const cubeSequential = new LogicalCube();
const cubeBatch = new LogicalCube();

for (const m of scramble) {
  cubeSequential.applyMove(m);
}
cubeBatch.applyAlgorithm(scramble.join(' '));

if (cubeSequential.getAsString() !== cubeBatch.getAsString()) {
  console.error('FAIL: Sequential move execution diverged from batch algorithm execution!');
  process.exit(1);
}
console.log('PASS: Sequential execution matches batch algorithm execution exactly.');

// 3. Step forward and Step backward (Undo) invariance
const testCube = new LogicalCube();
const initialStr = testCube.getAsString();

// Step forward 10 moves
for (let i = 0; i < 10; i++) {
  testCube.applyMove(scramble[i]);
}

// Invert and step backward 10 moves
for (let i = 9; i >= 0; i--) {
  const m = scramble[i];
  const inv = m.includes("'") ? m.replace("'", "") : m.includes('2') ? m : m + "'";
  testCube.applyMove(inv);
}

if (testCube.getAsString() !== initialStr) {
  console.error('FAIL: Stepping forward and reversing moves did not return cube to identity!');
  console.error('Expected:', initialStr);
  console.error('Got:     ', testCube.getAsString());
  process.exit(1);
}
console.log('PASS: Reversing applied moves returns cube to exact identity state.');

// 4. Solver state independence check
// Test that cloning scrambled state creates fully isolated instances
const targetScramble = generateScramble(20);
const masterCube = new LogicalCube();
masterCube.applyAlgorithm(targetScramble.join(' '));
const masterString = masterCube.getAsString();

const clone1 = masterCube.clone();
const clone2 = masterCube.clone();

// Modify clone1
clone1.applyMove('U');
if (clone1.getAsString() === masterString) {
  console.error('FAIL: Mutating clone1 affected master or clone was not independent.');
  process.exit(1);
}
if (clone2.getAsString() !== masterString) {
  console.error('FAIL: Mutating clone1 affected clone2!');
  process.exit(1);
}
if (masterCube.getAsString() !== masterString) {
  console.error('FAIL: Mutating clone1 mutated original master cube!');
  process.exit(1);
}
console.log('PASS: Cube state cloning is strictly independent across solver pipelines.');

console.log('\nALL SCRAMBLE PLAYBACK & INDEPENDENCE TESTS PASSED (4/4).');
