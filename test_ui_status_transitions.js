import assert from 'assert';
import { LogicalCube } from './src/core/LogicalCube.js';
import { CFOPSolver } from './src/core/CFOPSolver.js';
import { LayerByLayerSolver } from './src/core/LayerByLayerSolver.js';
import Cube from 'cubejs';

Cube.initSolver();

console.log('Testing UI status & cube state message transitions...\n');

// Mock helper representing AutomaticSolverView status transition logic
class StatusHUDTracker {
  constructor(logicalCube) {
    this.logicalCube = logicalCube;
    this.statusText = '';
    this.currentStep = 0;
    this.totalSteps = 0;
    this.currentMove = '';
    this.cubeStateLabel = '';
    this.isSolvedClass = false;
  }

  updateStatusHUD(statusText, currentStep, totalSteps, currentMove) {
    this.statusText = statusText;
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;
    this.currentMove = currentMove;
    const isSolved = this.logicalCube.isSolved();
    this.isSolvedClass = isSolved;
    this.cubeStateLabel = isSolved ? 'Cube State: Solved' : 'Cube State: Scrambled / Unsolved';
  }
}

// 1. Initial State
const logicalCube = new LogicalCube();
const tracker = new StatusHUDTracker(logicalCube);
assert.strictEqual(logicalCube.isSolved(), true);

// 2. Scramble generated
const scrambleMoves = ["R", "U", "R'", "U'"];
for (const m of scrambleMoves) logicalCube.applyMove(m);
tracker.updateStatusHUD('Scramble Generated — Ready to Play', 0, scrambleMoves.length, scrambleMoves[0]);
assert.strictEqual(logicalCube.isSolved(), false);
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'Scramble Generated — Ready to Play');
console.log('✓ Scenario 1: Scramble generated -> Scrambled/Unsolved');

// 3. Solve computed (e.g. CFOP-X or Kociemba or LBL)
tracker.updateStatusHUD('CFOP-X Solution Ready (80 moves)', 0, 80, 'R');
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'CFOP-X Solution Ready (80 moves)');
console.log('✓ Scenario 2: Solution ready (before playback) -> Scrambled/Unsolved + Solution Ready text');

// 4. Incomplete playback (stepping or mid-solve)
tracker.updateStatusHUD('Solving with CFOP-X...', 40, 80, 'U');
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'Solving with CFOP-X...');
console.log('✓ Scenario 3: Playback in-progress -> Scrambled/Unsolved');

// 5. Inverted scramble applied to reach solved state
const invMoves = ["U", "R", "U'", "R'"];
for (const m of invMoves) logicalCube.applyMove(m);
assert.strictEqual(logicalCube.isSolved(), true);

// Playback finishes and cube is solved
const isSolvedNow = logicalCube.isSolved();
tracker.updateStatusHUD(
  isSolvedNow ? 'CFOP-X Solved Successfully!' : 'Execution Finished — Cube Not Solved',
  80,
  80,
  ''
);
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Solved');
assert.strictEqual(tracker.statusText, 'CFOP-X Solved Successfully!');
console.log('✓ Scenario 4: Playback complete & cube solved -> Cube State: Solved + [Solver] Solved Successfully!');

// 6. Step back from solved state
// Undo last move ("R'") -> apply "R"
logicalCube.applyMove("R");
assert.strictEqual(logicalCube.isSolved(), false);
tracker.updateStatusHUD('CFOP-X Stepped Back', 79, 80, '');
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'CFOP-X Stepped Back');
console.log('✓ Scenario 5: Stepped back from solved state -> Cube State: Scrambled / Unsolved');

// 7. Step forward back to solved state
logicalCube.applyMove("R'");
assert.strictEqual(logicalCube.isSolved(), true);
tracker.updateStatusHUD(
  logicalCube.isSolved() ? 'CFOP-X Solved Successfully!' : 'Execution Finished — Cube Not Solved',
  80,
  80,
  "R'"
);
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Solved');
assert.strictEqual(tracker.statusText, 'CFOP-X Solved Successfully!');
console.log('✓ Scenario 6: Stepped forward to end -> Cube State: Solved + CFOP-X Solved Successfully!');

// 8. Reset scramble
logicalCube.reset();
for (const m of scrambleMoves) logicalCube.applyMove(m);
tracker.updateStatusHUD('Reset to Starting Scramble State', 0, scrambleMoves.length, '');
assert.strictEqual(logicalCube.isSolved(), false);
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'Reset to Starting Scramble State');
console.log('✓ Scenario 7: Reset to starting scramble state -> Cube State: Scrambled / Unsolved');

// 9. Playback finishes but cube NOT solved (simulating incomplete or corrupt sequence)
const badSolved = logicalCube.isSolved();
tracker.updateStatusHUD(
  badSolved ? 'Kociemba Solved Successfully!' : 'Execution Finished — Cube Not Solved',
  20,
  20,
  ''
);
assert.strictEqual(tracker.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
assert.strictEqual(tracker.statusText, 'Execution Finished — Cube Not Solved');
console.log('✓ Scenario 8: Playback finished but NOT solved -> Execution Finished — Cube Not Solved');

console.log('\nAll 8 UI state transition scenarios passed with 100% synchronization!');
