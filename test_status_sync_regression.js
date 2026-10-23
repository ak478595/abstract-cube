import assert from 'assert';
import { LogicalCube } from './src/core/LogicalCube.js';
import { SessionManager } from './src/core/SessionManager.js';
import { CFOPSolver } from './src/core/CFOPSolver.js';
import { LayerByLayerSolver } from './src/core/LayerByLayerSolver.js';
import Cube from 'cubejs';

Cube.initSolver();

// Polyfill localStorage for node environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

console.log('================================================================');
console.log('       STATUS SYNCHRONIZATION & FALSE UNSOLVED REGRESSION       ');
console.log('================================================================\n');

// Mock UI state harness simulating AutomaticSolverView
class SolverViewHarness {
  constructor() {
    this.logicalCube = new LogicalCube();
    this.sessionManager = new SessionManager(this.logicalCube);
    this.currentScramble = [];
    this.scrambleIndex = 0;
    this.playbackIndex = 0;
    this.statusText = '';
    this.hudCounter = '';
    this.cubeStateLabel = '';
  }

  updateStatusHUD(statusText, currentStep, totalSteps, currentMove) {
    this.statusText = statusText;
    if (totalSteps > 0) {
      this.hudCounter = `[${currentStep}/${totalSteps}] ${currentMove ? 'Move: ' + currentMove : ''}`;
    } else {
      this.hudCounter = '';
    }
    const isSolved = this.logicalCube.isSolved();
    this.cubeStateLabel = isSolved ? 'Cube State: Solved' : 'Cube State: Scrambled / Unsolved';
  }

  syncCubeToScrambleState() {
    this.logicalCube.reset();
    if (this.sessionManager.currentSession) {
      this.sessionManager.currentSession.moves = [];
      this.sessionManager.historyPointer = -1;
    }
    if (this.currentScramble && this.currentScramble.length > 0) {
      for (const m of this.currentScramble) {
        this.logicalCube.applyMove(m);
      }
      this.scrambleIndex = this.currentScramble.length;
    } else {
      this.scrambleIndex = 0;
    }
  }

  generateScramble(moves) {
    this.currentScramble = moves;
    this.scrambleIndex = 0;
    this.logicalCube.reset();
    if (this.sessionManager.currentSession) {
      this.sessionManager.currentSession.moves = [];
      this.sessionManager.historyPointer = -1;
    }
    this.updateStatusHUD('Scramble Generated — Ready to Play', 0, this.currentScramble.length, this.currentScramble[0]);
  }

  stepScrambleFwd() {
    if (this.scrambleIndex < this.currentScramble.length) {
      const move = this.currentScramble[this.scrambleIndex];
      this.sessionManager.recordMove(move);
      this.scrambleIndex++;
      this.updateStatusHUD(
        this.scrambleIndex >= this.currentScramble.length ? 'Scramble Complete' : 'Scrambling...',
        this.scrambleIndex,
        this.currentScramble.length,
        move
      );
    }
  }

  stepScrambleBack() {
    if (this.scrambleIndex > 0) {
      this.scrambleIndex--;
      const undone = this.sessionManager.undo();
      if (undone) {
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        this.logicalCube.applyMove(inv);
      }
      this.updateStatusHUD('Scramble Stepped Back', this.scrambleIndex, this.currentScramble.length, '');
    }
  }

  playSolver(solverName, moves) {
    this.syncCubeToScrambleState();
    this.playbackIndex = 0;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      this.sessionManager.recordMove(move);
      this.playbackIndex++;
    }

    const isSolved = this.logicalCube.isSolved();
    this.updateStatusHUD(
      isSolved ? `${solverName} Solved Successfully!` : 'Execution Finished — Cube Not Solved',
      moves.length,
      moves.length,
      ''
    );
  }

  stepPlaybackFwd(solverName, moves) {
    if (this.playbackIndex < moves.length) {
      const move = moves[this.playbackIndex];
      this.sessionManager.recordMove(move);
      this.playbackIndex++;
      if (this.playbackIndex >= moves.length) {
        const isSolved = this.logicalCube.isSolved();
        this.updateStatusHUD(
          isSolved ? `${solverName} Solved Successfully!` : 'Execution Finished — Cube Not Solved',
          this.playbackIndex,
          moves.length,
          move
        );
      } else {
        this.updateStatusHUD(`${solverName} Stepped Forward`, this.playbackIndex, moves.length, move);
      }
    }
  }

  stepPlaybackBack(solverName, moves) {
    if (this.playbackIndex > 0) {
      this.playbackIndex--;
      const undone = this.sessionManager.undo();
      if (undone) {
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        this.logicalCube.applyMove(inv);
      }
      this.updateStatusHUD(`${solverName} Stepped Back`, this.playbackIndex, moves.length, '');
    }
  }
}

// -------------------------------------------------------------
// TEST 1: Solved cube requiring zero moves
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  harness.updateStatusHUD('Cube Solved', 0, 0, '');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  console.log('✓ TEST 1: Solved cube requiring 0 moves validated');
}

// -------------------------------------------------------------
// TEST 2: Scramble followed by its exact inverse
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  const scramble = ["R", "U", "R'", "U'"];
  const inverse = ["U", "R", "U'", "R'"];
  harness.generateScramble(scramble);
  for (let i = 0; i < scramble.length; i++) harness.stepScrambleFwd();
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Scrambled / Unsolved');

  for (const inv of inverse) {
    harness.sessionManager.recordMove(inv);
  }
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  harness.updateStatusHUD('Inverse Applied — Solved', 4, 4, '');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  console.log('✓ TEST 2: Scramble followed by exact inverse validated');
}

// -------------------------------------------------------------
// TEST 3: Step backward and step forward of scramble
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  harness.generateScramble(["F", "R"]);
  harness.stepScrambleFwd(); // F
  harness.stepScrambleFwd(); // R
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  harness.stepScrambleBack(); // undo R
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  harness.stepScrambleBack(); // undo F
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  console.log('✓ TEST 3: Stepping backward restores solved state cleanly');
}

// -------------------------------------------------------------
// TEST 4: Successful solves from Kociemba, LBL, and CFOP-X (including 79-move Seed 15)
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  // Generate Seed 15 scramble (known 79-move CFOP-X solve)
  const moves = ['U', 'D', 'R', 'L', 'F', 'B'];
  const mods = ['', "'", '2'];
  const scSeq = [];
  let state = 15 + 1;
  for (let i = 0; i < 20; i++) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const m = moves[Math.abs(state) % 6] + mods[Math.abs(state >> 3) % 3];
    scSeq.push(m);
  }
  harness.generateScramble(scSeq);

  const scCube = new Cube();
  scCube.move(scSeq.join(' '));

  // 4a. CFOP-X Solve
  const cfopRes = CFOPSolver.solve(scCube);
  assert.strictEqual(cfopRes.success, true);
  assert.strictEqual(cfopRes.moves.length, 79);

  harness.playSolver('CFOP-X', cfopRes.moves);
  assert.strictEqual(harness.logicalCube.isSolved(), true, 'LogicalCube must be solved at [79/79]');
  assert.strictEqual(harness.statusText, 'CFOP-X Solved Successfully!');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  assert.strictEqual(harness.logicalCube.getAsString(), 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  console.log('✓ TEST 4a: CFOP-X 79-move solve verified with exact "CFOP-X Solved Successfully!"');

  // 4b. Step backward from solved state
  harness.stepPlaybackBack('CFOP-X', cfopRes.moves);
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  assert.strictEqual(harness.statusText, 'CFOP-X Stepped Back');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Scrambled / Unsolved');

  // Step forward back to solved state
  harness.stepPlaybackFwd('CFOP-X', cfopRes.moves);
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  assert.strictEqual(harness.statusText, 'CFOP-X Solved Successfully!');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  console.log('✓ TEST 4b: Stepping back and fwd at solve boundary maintains 100% sync');

  // 4c. Kociemba Solve
  const kocMoves = scCube.solve().trim().split(/\s+/).filter(Boolean);
  harness.playSolver('Kociemba', kocMoves);
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  assert.strictEqual(harness.statusText, 'Kociemba Solved Successfully!');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  assert.strictEqual(harness.logicalCube.getAsString(), 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  console.log('✓ TEST 4c: Kociemba solve verified with exact "Kociemba Solved Successfully!"');

  // 4d. Layer-by-Layer (LBL) Solve
  const lblRes = LayerByLayerSolver.solve(scCube);
  assert.strictEqual(lblRes.isSolved, true);
  harness.playSolver('LBL', lblRes.moves);
  assert.strictEqual(harness.logicalCube.isSolved(), true);
  assert.strictEqual(harness.statusText, 'LBL Solved Successfully!');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Solved');
  assert.strictEqual(harness.logicalCube.getAsString(), 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  console.log('✓ TEST 4d: LBL solve verified with exact "LBL Solved Successfully!"');
}

// -------------------------------------------------------------
// TEST 5: Reset after successful solve
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  harness.generateScramble(["R", "U", "R'", "U'"]);
  harness.playSolver('CFOP-X', ["U", "R", "U'", "R'"]);
  assert.strictEqual(harness.logicalCube.isSolved(), true);

  // Reset to start
  harness.syncCubeToScrambleState();
  harness.updateStatusHUD('Reset to Starting Scramble State', 0, 4, '');
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  assert.strictEqual(harness.statusText, 'Reset to Starting Scramble State');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
  console.log('✓ TEST 5: Reset after successful solve clears solved status');
}

// -------------------------------------------------------------
// TEST 6: New scramble after successful solve
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  harness.generateScramble(["R"]);
  harness.playSolver('Kociemba', ["R'"]);
  assert.strictEqual(harness.logicalCube.isSolved(), true);

  harness.generateScramble(["L", "F"]);
  assert.strictEqual(harness.logicalCube.isSolved(), true); // Before scramble plays, cube is identity
  assert.strictEqual(harness.statusText, 'Scramble Generated — Ready to Play');
  harness.stepScrambleFwd();
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
  console.log('✓ TEST 6: New scramble after solve correctly transitions status');
}

// -------------------------------------------------------------
// TEST 7: Incomplete solution rejection
// -------------------------------------------------------------
{
  const harness = new SolverViewHarness();
  harness.generateScramble(["R", "U"]);
  // Truncated solution: only play ["U'"] without ["R'"]
  harness.playSolver('CFOP-X', ["U'"]);
  assert.strictEqual(harness.logicalCube.isSolved(), false);
  assert.strictEqual(harness.statusText, 'Execution Finished — Cube Not Solved');
  assert.strictEqual(harness.cubeStateLabel, 'Cube State: Scrambled / Unsolved');
  console.log('✓ TEST 7: Incomplete solution correctly rejected with "Execution Finished — Cube Not Solved"');
}

console.log('\n================================================================');
console.log('     ALL STATUS SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!       ');
console.log('================================================================');
