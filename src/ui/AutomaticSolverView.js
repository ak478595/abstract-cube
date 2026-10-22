/**
 * AutomaticSolverView - Dedicated Scramble & Solver Mode
 * Implements Section 9 & Section 10 of the specification:
 * - Controls:
 *   - Generate Scramble (avoids redundant turns, shows full sequence)
 *   - Play Scramble (animates move by move, record in history)
 *   - Pause
 *   - Step Forward
 *   - Step Backward
 *   - Reset Scramble (returns to state before scramble)
 *   - Solve Cube (computes actual solution with Herbert Kociemba's two-phase algorithm)
 * - Solution Playback:
 *   - Play Solution, Pause, Step Forward, Step Backward, Restart Solution
 *   - Live step counter: "Step X of Y", Current Move, Remaining Moves
 *   - Interactive move badges showing progress
 * - Solver Result:
 *   - Verified programmatic solved state
 *   - Total moves count, elapsed time, complete scramble, complete solution
 *   - Clarification of God's Number (20 HTM) vs Kociemba near-optimal solver
 */

import { generateScramble } from '../core/ScrambleGenerator.js';
import { LogicalCube } from '../core/LogicalCube.js';

export function renderAutomaticSolverView(container, {
  cubeEngine,
  logicalCube,
  sessionManager,
  onExecuteMove,
  onResetView
}) {
  container.innerHTML = `
    <div class="view-solver">
      <canvas id="lab-bg-canvas"></canvas>

      <div class="lab-main-layout">
        <!-- LEFT COLUMN: 3D CUBE VIEWPORT -->
        <div class="lab-viewport-column">
          <div class="cube-viewport-panel">
            <div class="viewport-toolbar">
              <div class="viewport-title-area">
                <div class="status-indicator ${logicalCube.isSolved() ? '' : 'unsolved'}" id="solver-status-dot"></div>
                <span class="viewport-heading" id="solver-status-label">
                  ${logicalCube.isSolved() ? 'Cube State: Solved' : 'Cube State: Scrambled / Unsolved'}
                </span>
              </div>

              <div class="viewport-controls-group">
                <button class="btn-icon-subtle" id="solver-btn-reset-view">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Reset View
                </button>
              </div>
            </div>

            <div class="three-canvas-container" id="solver-3d-viewport">
              <div class="viewport-overlay-hint">Rotate camera to inspect cube faces during solving</div>
            </div>

            <!-- Current Playback Telemetry Banner -->
            <div class="selection-hud-card" id="playback-hud">
              <div class="selection-info-cluster">
                <span style="color: var(--lab-text-muted);">Execution Status:</span>
                <span class="selected-face-badge" id="hud-playback-status" style="border-color: var(--lab-accent);">Idle</span>
                <span style="color: var(--lab-text-muted); font-size: 0.85rem;" id="hud-step-counter"></span>
              </div>
            </div>
          </div>

          <!-- Solver Success Card -->
          <div class="control-card-panel" id="solver-success-banner" style="display: none; margin-top: 1.25rem; border-color: var(--lab-success);">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--lab-success);">Cube Successfully Solved!</h3>
            </div>
            <p style="font-size: 0.9rem; color: var(--lab-text-muted); margin-bottom: 1rem;">
              The cube has been restored to the identity state \(e\). All pieces and facelet orientations programmatically verified.
            </p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; background: var(--lab-surface-elevated); padding: 0.85rem; border-radius: 8px;">
              <div>
                <span style="font-size: 0.72rem; color: var(--lab-text-muted); text-transform: uppercase;">Solution Moves</span>
                <div style="font-size: 1.2rem; font-weight: 700; color: #FFF;" id="res-move-count">0</div>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--lab-text-muted); text-transform: uppercase;">Compute Time</span>
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--lab-accent);" id="res-compute-time">0 ms</div>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--lab-text-muted); text-transform: uppercase;">Optimality</span>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--lab-gold);" title="Kociemba Two-Phase yields near-optimal solutions (typically ≤ 22 moves HTM)">Kociemba 2-Phase (≤22 moves)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: SCRAMBLE & SOLVER CONTROLS -->
        <div class="lab-sidebar-column">
          <!-- 1. SCRAMBLE GENERATOR CARD -->
          <div class="control-card-panel">
            <h3 class="panel-header-title">1. Automatic Scrambler</h3>
            <p class="panel-header-desc">Generate official pseudo-random move sequences</p>

            <div class="scramble-banner">
              <div class="scramble-title-label">Current Scramble Sequence</div>
              <div class="scramble-text-display" id="scramble-sequence-box">
                Click "Generate Scramble" to create a new sequence
              </div>
            </div>

            <div class="session-bar-actions" style="margin-bottom: 0.75rem;">
              <button class="btn-action-primary" id="btn-gen-scramble">Generate Scramble</button>
              <button class="btn-action-secondary" id="btn-play-scramble" disabled>Play Scramble</button>
            </div>

            <div class="playback-controls-row">
              <button class="btn-icon-subtle" id="btn-scramble-step-back" disabled>&larr; Step Back</button>
              <button class="btn-icon-subtle" id="btn-scramble-pause" disabled>Pause</button>
              <button class="btn-icon-subtle" id="btn-scramble-step-fwd" disabled>Step Forward &rarr;</button>
              <button class="btn-icon-subtle" id="btn-reset-scramble" style="margin-left: auto;">Reset to Start</button>
            </div>
          </div>

          <!-- 2. AUTOMATIC SOLVER CARD -->
          <div class="control-card-panel">
            <h3 class="panel-header-title">2. Kociemba Two-Phase Solver</h3>
            <p class="panel-header-desc">
              Solves the cube using Herbert Kociemba's two-phase algorithm. Guarantees near-optimal solutions (at most 22 moves).
            </p>

            <button class="btn-action-primary" id="btn-solve-cube" style="width: 100%; margin-bottom: 1rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -2px; margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Solve Cube
            </button>

            <!-- Solution playback controls -->
            <div id="solution-section" style="display: none;">
              <div class="scramble-banner">
                <div class="scramble-title-label">Computed Solution Sequence</div>
                <div class="scramble-text-display" id="solution-sequence-box" style="color: var(--lab-success);">
                  -
                </div>
              </div>

              <div class="playback-controls-row" style="margin-bottom: 0.75rem;">
                <button class="btn-action-primary" id="btn-play-solution">Play Solution</button>
                <button class="btn-action-secondary" id="btn-pause-solution">Pause</button>
                <button class="btn-action-secondary" id="btn-restart-solution">Restart</button>
              </div>

              <div class="playback-controls-row">
                <button class="btn-icon-subtle" id="btn-solution-step-back">&larr; Step Back</button>
                <button class="btn-icon-subtle" id="btn-solution-step-fwd">Step Forward &rarr;</button>
              </div>

              <div class="solution-steps-list" id="solution-step-chips">
                <!-- Move badges rendered here -->
              </div>
            </div>

            <!-- God's Number Information note -->
            <div style="background: rgba(31, 41, 55, 0.4); border-left: 3px solid var(--lab-gold); padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; margin-top: 1.25rem; font-size: 0.82rem; color: var(--lab-text-muted);">
              <strong style="color: var(--lab-gold);">Theoretical Note:</strong> God's Number for the Rubik's Cube is exactly 20 moves under the Half-Turn Metric (HTM) (proved by Rokicki et al., 2010). The Kociemba two-phase algorithm used here finds a solution in typically under 0.05 seconds with 20-22 moves.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mount Three.js canvas
  const mountPoint = container.querySelector('#solver-3d-viewport');
  if (cubeEngine && cubeEngine.container !== mountPoint) {
    mountPoint.appendChild(cubeEngine.renderer.domElement);
    cubeEngine.container = mountPoint;
    cubeEngine.onResize();
  }

  // State
  let currentScramble = [];
  let scrambleIndex = 0;
  let isPlayingScramble = false;

  let currentSolution = [];
  let solutionIndex = 0;
  let isPlayingSolution = false;

  let stateBeforeScramble = logicalCube.getAsString();

  // Elements
  const scrambleBox = container.querySelector('#scramble-sequence-box');
  const btnGenScramble = container.querySelector('#btn-gen-scramble');
  const btnPlayScramble = container.querySelector('#btn-play-scramble');
  const btnScramblePause = container.querySelector('#btn-scramble-pause');
  const btnScrambleStepFwd = container.querySelector('#btn-scramble-step-fwd');
  const btnScrambleStepBack = container.querySelector('#btn-scramble-step-back');
  const btnResetScramble = container.querySelector('#btn-reset-scramble');

  const btnSolveCube = container.querySelector('#btn-solve-cube');
  const solutionSection = container.querySelector('#solution-section');
  const solutionBox = container.querySelector('#solution-sequence-box');
  const btnPlaySolution = container.querySelector('#btn-play-solution');
  const btnPauseSolution = container.querySelector('#btn-pause-solution');
  const btnRestartSolution = container.querySelector('#btn-restart-solution');
  const btnSolutionStepFwd = container.querySelector('#btn-solution-step-fwd');
  const btnSolutionStepBack = container.querySelector('#btn-solution-step-back');
  const stepChipsContainer = container.querySelector('#solution-step-chips');

  const hudStatus = container.querySelector('#hud-playback-status');
  const hudCounter = container.querySelector('#hud-step-counter');
  const successBanner = container.querySelector('#solver-success-banner');
  const resMoveCount = container.querySelector('#res-move-count');
  const resComputeTime = container.querySelector('#res-compute-time');

  function updateStatusHUD(status, currentStep, totalSteps, currentMove) {
    hudStatus.textContent = status;
    if (totalSteps > 0) {
      const remaining = Math.max(0, totalSteps - currentStep);
      hudCounter.textContent = `Step ${currentStep} of ${totalSteps} ${currentMove ? `(Current Move: ${currentMove})` : ''} • Remaining: ${remaining}`;
    } else {
      hudCounter.textContent = '';
    }

    const solved = logicalCube.isSolved();
    const statusDot = container.querySelector('#solver-status-dot');
    const statusLabel = container.querySelector('#solver-status-label');
    statusDot.className = `status-indicator ${solved ? '' : 'unsolved'}`;
    statusLabel.textContent = solved ? 'Cube State: Solved' : 'Cube State: Scrambled / Unsolved';
  }

  // 1. Generate Scramble
  btnGenScramble.addEventListener('click', () => {
    stateBeforeScramble = logicalCube.getAsString();
    currentScramble = generateScramble(20);
    scrambleIndex = 0;
    isPlayingScramble = false;

    scrambleBox.textContent = currentScramble.join(' ');
    btnPlayScramble.disabled = false;
    btnScrambleStepFwd.disabled = false;
    btnScrambleStepBack.disabled = true;
    btnScramblePause.disabled = true;

    updateStatusHUD('Scramble Ready', 0, currentScramble.length, currentScramble[0]);
    successBanner.style.display = 'none';
  });

  // Play Scramble
  async function stepScrambleFwd() {
    if (scrambleIndex >= currentScramble.length) {
      isPlayingScramble = false;
      btnScramblePause.disabled = true;
      btnPlayScramble.disabled = true;
      updateStatusHUD('Scramble Complete', currentScramble.length, currentScramble.length, '');
      return;
    }

    const move = currentScramble[scrambleIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Scrambling...', scrambleIndex + 1, currentScramble.length, move);
    await cubeEngine.executeMove(move);
    scrambleIndex++;
    btnScrambleStepBack.disabled = false;

    if (scrambleIndex >= currentScramble.length) {
      isPlayingScramble = false;
      btnScramblePause.disabled = true;
      btnPlayScramble.disabled = true;
      updateStatusHUD('Scramble Complete', currentScramble.length, currentScramble.length, '');
    } else if (isPlayingScramble) {
      stepScrambleFwd();
    }
  }

  btnPlayScramble.addEventListener('click', () => {
    isPlayingScramble = true;
    btnScramblePause.disabled = false;
    btnPlayScramble.disabled = true;
    stepScrambleFwd();
  });

  btnScramblePause.addEventListener('click', () => {
    isPlayingScramble = false;
    btnScramblePause.disabled = true;
    btnPlayScramble.disabled = false;
    updateStatusHUD('Paused', scrambleIndex, currentScramble.length, '');
  });

  btnScrambleStepFwd.addEventListener('click', () => {
    if (scrambleIndex < currentScramble.length) {
      stepScrambleFwd();
    }
  });

  btnScrambleStepBack.addEventListener('click', async () => {
    if (scrambleIndex > 0) {
      scrambleIndex--;
      const undone = sessionManager.undo();
      if (undone) {
        // Apply inverse move visually
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        await cubeEngine.executeMove(inv);
        updateStatusHUD('Stepped Back', scrambleIndex, currentScramble.length, move);
      }
      btnScrambleStepFwd.disabled = false;
      if (scrambleIndex === 0) btnScrambleStepBack.disabled = true;
    }
  });

  btnResetScramble.addEventListener('click', () => {
    isPlayingScramble = false;
    logicalCube.reset();
    cubeEngine.resetToIdentity();
    scrambleIndex = 0;
    updateStatusHUD('Cube Reset to Solved', 0, 0, '');
    successBanner.style.display = 'none';
    solutionSection.style.display = 'none';
  });

  // 2. Solve Cube
  btnSolveCube.addEventListener('click', async () => {
    if (logicalCube.isSolved()) {
      alert('The cube is already in the solved identity state e!');
      return;
    }

    btnSolveCube.disabled = true;
    btnSolveCube.textContent = 'Computing Solution...';

    // Ensure Kociemba solver tables are initialized
    const t0 = performance.now();
    await LogicalCube.ensureSolver();
    const solutionStr = logicalCube.solve();
    const computeDuration = Math.round(performance.now() - t0);

    btnSolveCube.disabled = false;
    btnSolveCube.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -2px; margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Solve Cube
    `;

    if (!solutionStr) {
      alert('Cube solver did not return a valid sequence. Please check cube state.');
      return;
    }

    currentSolution = solutionStr.trim().split(/\s+/).filter(Boolean);
    solutionIndex = 0;
    isPlayingSolution = false;

    solutionBox.textContent = currentSolution.join(' ');
    solutionSection.style.display = 'block';

    renderSolutionBadges();
    updateStatusHUD('Solution Ready', 0, currentSolution.length, currentSolution[0]);

    resMoveCount.textContent = currentSolution.length;
    resComputeTime.textContent = `${computeDuration} ms`;
  });

  function renderSolutionBadges() {
    stepChipsContainer.innerHTML = currentSolution.map((move, i) => {
      let cls = 'solution-step-badge';
      if (i < solutionIndex) cls += ' completed-step';
      else if (i === solutionIndex) cls += ' current-step';
      return `<span class="${cls}" data-step="${i}">#${i + 1} ${move}</span>`;
    }).join('');
  }

  async function stepSolutionFwd() {
    if (solutionIndex >= currentSolution.length) {
      isPlayingSolution = false;
      onSolutionFinished();
      return;
    }

    const move = currentSolution[solutionIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Solving...', solutionIndex + 1, currentSolution.length, move);

    renderSolutionBadges();
    await cubeEngine.executeMove(move);

    solutionIndex++;
    renderSolutionBadges();

    if (solutionIndex >= currentSolution.length) {
      isPlayingSolution = false;
      onSolutionFinished();
    } else if (isPlayingSolution) {
      stepSolutionFwd();
    }
  }

  function onSolutionFinished() {
    renderSolutionBadges();
    if (logicalCube.isSolved()) {
      updateStatusHUD('Solved!', currentSolution.length, currentSolution.length, '');
      successBanner.style.display = 'block';
      successBanner.scrollIntoView({ behavior: 'smooth' });
    }
  }

  btnPlaySolution.addEventListener('click', () => {
    if (solutionIndex >= currentSolution.length) {
      solutionIndex = 0;
    }
    isPlayingSolution = true;
    stepSolutionFwd();
  });

  btnPauseSolution.addEventListener('click', () => {
    isPlayingSolution = false;
    updateStatusHUD('Paused', solutionIndex, currentSolution.length, '');
  });

  btnRestartSolution.addEventListener('click', async () => {
    isPlayingSolution = false;
    // Step backward all applied solution moves
    while (solutionIndex > 0) {
      solutionIndex--;
      const undone = sessionManager.undo();
      if (undone) {
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        await cubeEngine.executeMove(inv, true);
      }
    }
    renderSolutionBadges();
    updateStatusHUD('Solution Restarted', 0, currentSolution.length, currentSolution[0]);
    successBanner.style.display = 'none';
  });

  btnSolutionStepFwd.addEventListener('click', () => {
    if (solutionIndex < currentSolution.length) {
      stepSolutionFwd();
    }
  });

  btnSolutionStepBack.addEventListener('click', async () => {
    if (solutionIndex > 0) {
      solutionIndex--;
      const undone = sessionManager.undo();
      if (undone) {
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        await cubeEngine.executeMove(inv);
      }
      renderSolutionBadges();
      updateStatusHUD('Stepped Back', solutionIndex, currentSolution.length, '');
      successBanner.style.display = 'none';
    }
  });

  container.querySelector('#solver-btn-reset-view')?.addEventListener('click', () => onResetView());
}
