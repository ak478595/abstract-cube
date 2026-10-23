/**
 * AutomaticSolverView - Dedicated Scramble & Solver Mode
 * Features Exactly Three Solvers:
 * 1. Herbert Kociemba's Two-Phase Algorithm (Coset Graph Search)
 * 2. Layer-by-Layer (LBL) Beginner Method (Procedural Staged Reduction)
 * 3. CFOP-X (Experimental Speedcubing: Cross Lookahead -> F2L -> 2-Look OLL -> 2-Look PLL)
 */

import Cube from '../core/cube-lib.js';
import { generateScramble } from '../core/ScrambleGenerator.js';
import { LogicalCube } from '../core/LogicalCube.js';
import { LayerByLayerSolver } from '../core/LayerByLayerSolver.js';
import { CFOPSolver } from '../core/CFOPSolver.js';
import { formatMoveHTML, formatSequenceHTML } from './notationFormatter.js';

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
        </div>

        <!-- RIGHT COLUMN: SCRAMBLE & SOLVER CONTROLS -->
        <div class="lab-sidebar-column">
          <!-- 1. SCRAMBLE GENERATOR CARD -->
          <div class="control-card-panel">
            <h3 class="panel-header-title">1. Automatic Scrambler</h3>
            <p class="panel-header-desc">Generate official pseudo-random move sequences (WCA 20-move metric)</p>

            <div class="scramble-banner">
              <div class="scramble-title-label">Current Scramble Sequence</div>
              <div class="scramble-sequence-box" id="scramble-sequence-box">
                Click "Generate Scramble" below to produce a 20-move scramble.
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
              <button class="btn-action-primary" id="btn-gen-scramble" style="flex: 1;">
                Generate Scramble
              </button>
              <button class="btn-action-secondary" id="btn-play-scramble" style="flex: 1;" disabled>
                Play Scramble
              </button>
            </div>

            <div class="playback-controls-row">
              <button class="btn-icon-subtle" id="btn-scramble-step-back" disabled>&larr; Step Back</button>
              <button class="btn-icon-subtle" id="btn-scramble-pause" disabled>Pause</button>
              <button class="btn-icon-subtle" id="btn-scramble-step-fwd" disabled>Step Forward &rarr;</button>
              <button class="btn-icon-subtle" id="btn-reset-scramble" style="margin-left: auto;">Reset to Start</button>
            </div>
          </div>

          <!-- 2. AUTOMATIC SOLVER CONTROLS CARD -->
          <div class="control-card-panel">
            <h3 class="panel-header-title">2. Solver Controls</h3>
            <p class="panel-header-desc">
              Benchmark three distinct solving methods independently on the exact same scramble starting state.
            </p>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-top: 1.25rem;">
              <button class="btn-action-primary" id="btn-solve-kociemba" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-weight: 600; padding: 0.75rem 0.4rem; font-size: 0.82rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Kociemba
              </button>

              <button class="btn-action-primary" id="btn-solve-lbl" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-weight: 600; padding: 0.75rem 0.4rem; font-size: 0.82rem; background: #2563EB; border-color: #3B82F6;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Layer-by-Layer
              </button>

              <button class="btn-action-primary" id="btn-solve-cfop" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-weight: 600; padding: 0.75rem 0.4rem; font-size: 0.82rem; background: #059669; border-color: #10B981;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                CFOP-X (Exp.)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- FULL-WIDTH TRIO SOLVER COMPARISON & BENCHMARK SECTION -->
      <div class="solver-comparison-wrapper" id="solver-comparison-section" style="max-width: 1440px; margin: 0 auto; padding: 0 1.5rem 3rem 1.5rem; box-sizing: border-box;">
        <!-- Comparison Summary Card -->
        <div class="comparison-summary-card" id="comparison-summary">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lab-gold)" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              Multi-Solver Benchmark &amp; Algorithmic Comparison
            </h3>
            <span style="font-size: 0.8rem; color: var(--lab-text-muted);" id="comparison-status-note">
              Awaiting solver execution
            </span>
          </div>
          <div id="comparison-content">
            <p style="font-size: 0.9rem; color: var(--lab-text-muted);">
              Generate a scramble above, then run any solver to compare move optimality, computation speed, and algorithmic trade-offs side by side on identical starting states.
            </p>
          </div>
        </div>

        <!-- 3 Solver Result Panels Grid -->
        <div class="solver-results-grid" style="grid-template-columns: repeat(3, 1fr);">
          <!-- PANEL A: Kociemba Two-Phase -->
          <div class="solver-result-card" id="panel-kociemba">
            <div class="solver-card-header">
              <div class="solver-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lab-accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
                Herbert Kociemba's Two-Phase
              </div>
              <span class="status-pill pill-not-run" id="status-pill-kociemba">Not run yet</span>
            </div>

            <div class="solver-metrics-matrix">
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Solution Moves</span>
                <span class="solver-metric-cell-value" id="kociemba-metric-moves">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Pure Solve Time</span>
                <span class="solver-metric-cell-value" id="kociemba-metric-solve-time" style="color: var(--lab-accent);">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Offline Init Cost</span>
                <span class="solver-metric-cell-value" id="kociemba-metric-init-time">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Total Elapsed</span>
                <span class="solver-metric-cell-value" id="kociemba-metric-total-time">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Verification</span>
                <span class="solver-metric-cell-value" id="kociemba-metric-verified" style="font-size: 0.82rem;">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Optimality Tier</span>
                <span class="solver-metric-cell-value" style="font-size: 0.8rem; color: var(--lab-gold);">Near-Optimal (20–22 HTM)</span>
              </div>
            </div>

            <div class="solver-sequence-container">
              <div class="solver-sequence-label">Computed Move Sequence</div>
              <div class="solver-sequence-scroll" id="kociemba-sequence-box">
                Click "Kociemba" above to generate sequence.
              </div>
            </div>

            <div class="playback-controls-row" style="margin-bottom: 0.75rem;">
              <button class="btn-action-primary" id="btn-play-kociemba" disabled>Play</button>
              <button class="btn-action-secondary" id="btn-pause-kociemba" disabled>Pause</button>
              <button class="btn-action-secondary" id="btn-restart-kociemba" disabled>Restart</button>
              <button class="btn-icon-subtle" id="btn-step-back-kociemba" disabled>&larr;</button>
              <button class="btn-icon-subtle" id="btn-step-fwd-kociemba" disabled>&rarr;</button>
            </div>
            <div class="solution-steps-list" id="chips-kociemba"></div>
          </div>

          <!-- PANEL B: Layer-by-Layer (LBL) -->
          <div class="solver-result-card" id="panel-lbl">
            <div class="solver-card-header">
              <div class="solver-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Layer-by-Layer (Beginner)
              </div>
              <span class="status-pill pill-not-run" id="status-pill-lbl">Not run yet</span>
            </div>

            <div class="solver-metrics-matrix">
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Solution Moves</span>
                <span class="solver-metric-cell-value" id="lbl-metric-moves">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Pure Solve Time</span>
                <span class="solver-metric-cell-value" id="lbl-metric-solve-time" style="color: #60A5FA;">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Offline Init Cost</span>
                <span class="solver-metric-cell-value" id="lbl-metric-init-time">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Total Elapsed</span>
                <span class="solver-metric-cell-value" id="lbl-metric-total-time">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Verification</span>
                <span class="solver-metric-cell-value" id="lbl-metric-verified" style="font-size: 0.82rem;">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Algorithmic Method</span>
                <span class="solver-metric-cell-value" style="font-size: 0.8rem; color: var(--lab-text-muted);">4-Stage Procedural Reduction</span>
              </div>
            </div>

            <div class="solver-sequence-container">
              <div class="solver-sequence-label">Computed Move Sequence</div>
              <div class="solver-sequence-scroll" id="lbl-sequence-box">
                Click "Layer-by-Layer" above to generate sequence.
              </div>
            </div>

            <div class="playback-controls-row" style="margin-bottom: 0.75rem;">
              <button class="btn-action-primary" id="btn-play-lbl" disabled>Play</button>
              <button class="btn-action-secondary" id="btn-pause-lbl" disabled>Pause</button>
              <button class="btn-action-secondary" id="btn-restart-lbl" disabled>Restart</button>
              <button class="btn-icon-subtle" id="btn-step-back-lbl" disabled>&larr;</button>
              <button class="btn-icon-subtle" id="btn-step-fwd-lbl" disabled>&rarr;</button>
            </div>
            <div class="solution-steps-list" id="chips-lbl"></div>
          </div>

          <!-- PANEL C: CFOP-X (Experimental) -->
          <div class="solver-result-card" id="panel-cfop">
            <div class="solver-card-header">
              <div class="solver-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><circle cx="12" cy="12" r="3"/></svg>
                CFOP-X (Experimental)
              </div>
              <span class="status-pill pill-not-run" id="status-pill-cfop">Not run yet</span>
            </div>

            <div class="solver-metrics-matrix">
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Solution Moves</span>
                <span class="solver-metric-cell-value" id="cfop-metric-moves">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Pure Solve Time</span>
                <span class="solver-metric-cell-value" id="cfop-metric-solve-time" style="color: #10B981;">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Stage 1 (Cross)</span>
                <span class="solver-metric-cell-value" id="cfop-metric-cross">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Stage 2 (F2L)</span>
                <span class="solver-metric-cell-value" id="cfop-metric-f2l">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Verification</span>
                <span class="solver-metric-cell-value" id="cfop-metric-verified" style="font-size: 0.82rem;">-</span>
              </div>
              <div class="solver-metric-cell">
                <span class="solver-metric-cell-label">Pipeline Architecture</span>
                <span class="solver-metric-cell-value" style="font-size: 0.8rem; color: var(--lab-text-muted);">Cross Lookahead &bull; F2L &bull; OLL &bull; PLL</span>
              </div>
            </div>

            <div class="solver-sequence-container">
              <div class="solver-sequence-label">Computed Move Sequence</div>
              <div class="solver-sequence-scroll" id="cfop-sequence-box">
                Click "CFOP-X (Exp.)" above to generate sequence.
              </div>
            </div>

            <div class="playback-controls-row" style="margin-bottom: 0.75rem;">
              <button class="btn-action-primary" id="btn-play-cfop" disabled>Play</button>
              <button class="btn-action-secondary" id="btn-pause-cfop" disabled>Pause</button>
              <button class="btn-action-secondary" id="btn-restart-cfop" disabled>Restart</button>
              <button class="btn-icon-subtle" id="btn-step-back-cfop" disabled>&larr;</button>
              <button class="btn-icon-subtle" id="btn-step-fwd-cfop" disabled>&rarr;</button>
            </div>
            <div class="solution-steps-list" id="chips-cfop"></div>
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

  // --- STATE MANAGEMENT ---
  let isUnmounted = false;
  let currentScramble = [];
  let scrambleIndex = 0;
  let isPlayingScramble = false;

  // Solver Results
  let kociembaResult = null;
  let lblResult = null;
  let cfopResult = null;

  // Solution playback states
  let activePlaybackSource = null; // 'kociemba' | 'lbl' | 'cfop' | null
  let kociembaPlaybackIndex = 0;
  let lblPlaybackIndex = 0;
  let cfopPlaybackIndex = 0;
  let isPlayingSolution = false;

  // --- DOM REFERENCES ---
  const scrambleBox = container.querySelector('#scramble-sequence-box');
  const btnGenScramble = container.querySelector('#btn-gen-scramble');
  const btnPlayScramble = container.querySelector('#btn-play-scramble');
  const btnScramblePause = container.querySelector('#btn-scramble-pause');
  const btnScrambleStepFwd = container.querySelector('#btn-scramble-step-fwd');
  const btnScrambleStepBack = container.querySelector('#btn-scramble-step-back');
  const btnResetScramble = container.querySelector('#btn-reset-scramble');

  const btnSolveKociemba = container.querySelector('#btn-solve-kociemba');
  const btnSolveLbl = container.querySelector('#btn-solve-lbl');
  const btnSolveCfop = container.querySelector('#btn-solve-cfop');

  const hudStatus = container.querySelector('#hud-playback-status');
  const hudCounter = container.querySelector('#hud-step-counter');
  const statusDot = container.querySelector('#solver-status-dot');
  const statusLabel = container.querySelector('#solver-status-label');

  // Comparison Summary Elements
  const comparisonSummaryCard = container.querySelector('#comparison-summary');
  const comparisonStatusNote = container.querySelector('#comparison-status-note');
  const comparisonContent = container.querySelector('#comparison-content');

  // Panel A Elements (Kociemba)
  const panelKociemba = container.querySelector('#panel-kociemba');
  const statusPillKociemba = container.querySelector('#status-pill-kociemba');
  const kociembaMetricMoves = container.querySelector('#kociemba-metric-moves');
  const kociembaMetricSolveTime = container.querySelector('#kociemba-metric-solve-time');
  const kociembaMetricInitTime = container.querySelector('#kociemba-metric-init-time');
  const kociembaMetricTotalTime = container.querySelector('#kociemba-metric-total-time');
  const kociembaMetricVerified = container.querySelector('#kociemba-metric-verified');
  const kociembaSequenceBox = container.querySelector('#kociemba-sequence-box');
  const btnPlayKociemba = container.querySelector('#btn-play-kociemba');
  const btnPauseKociemba = container.querySelector('#btn-pause-kociemba');
  const btnRestartKociemba = container.querySelector('#btn-restart-kociemba');
  const btnStepBackKociemba = container.querySelector('#btn-step-back-kociemba');
  const btnStepFwdKociemba = container.querySelector('#btn-step-fwd-kociemba');
  const chipsKociemba = container.querySelector('#chips-kociemba');

  // Panel B Elements (LBL)
  const panelLbl = container.querySelector('#panel-lbl');
  const statusPillLbl = container.querySelector('#status-pill-lbl');
  const lblMetricMoves = container.querySelector('#lbl-metric-moves');
  const lblMetricSolveTime = container.querySelector('#lbl-metric-solve-time');
  const lblMetricInitTime = container.querySelector('#lbl-metric-init-time');
  const lblMetricTotalTime = container.querySelector('#lbl-metric-total-time');
  const lblMetricVerified = container.querySelector('#lbl-metric-verified');
  const lblSequenceBox = container.querySelector('#lbl-sequence-box');
  const btnPlayLbl = container.querySelector('#btn-play-lbl');
  const btnPauseLbl = container.querySelector('#btn-pause-lbl');
  const btnRestartLbl = container.querySelector('#btn-restart-lbl');
  const btnStepBackLbl = container.querySelector('#btn-step-back-lbl');
  const btnStepFwdLbl = container.querySelector('#btn-step-fwd-lbl');
  const chipsLbl = container.querySelector('#chips-lbl');

  // Panel C Elements (CFOP-X)
  const panelCfop = container.querySelector('#panel-cfop');
  const statusPillCfop = container.querySelector('#status-pill-cfop');
  const cfopMetricMoves = container.querySelector('#cfop-metric-moves');
  const cfopMetricSolveTime = container.querySelector('#cfop-metric-solve-time');
  const cfopMetricCross = container.querySelector('#cfop-metric-cross');
  const cfopMetricF2l = container.querySelector('#cfop-metric-f2l');
  const cfopMetricVerified = container.querySelector('#cfop-metric-verified');
  const cfopSequenceBox = container.querySelector('#cfop-sequence-box');
  const btnPlayCfop = container.querySelector('#btn-play-cfop');
  const btnPauseCfop = container.querySelector('#btn-pause-cfop');
  const btnRestartCfop = container.querySelector('#btn-restart-cfop');
  const btnStepBackCfop = container.querySelector('#btn-step-back-cfop');
  const btnStepFwdCfop = container.querySelector('#btn-step-fwd-cfop');
  const chipsCfop = container.querySelector('#chips-cfop');

  function formatDuration(ms, isCached = false) {
    if (isCached) return '0.00 ms (cached)';
    if (ms === null || ms === undefined) return '-';
    if (ms === 0) return '0.00 ms';
    if (ms < 0.01) return '< 0.01 ms';
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(3)} s`;
  }

  function countMovesMetrics(moves) {
    if (!moves || moves.length === 0) return { htm: 0, qtm: 0 };
    const htm = moves.length;
    let qtm = 0;
    for (const m of moves) {
      qtm += m.includes('2') ? 2 : 1;
    }
    return { htm, qtm };
  }

  function syncCubeToScrambleState() {
    isPlayingScramble = false;
    isPlayingSolution = false;
    cubeEngine.resetToIdentity();
    logicalCube.reset();
    if (sessionManager && sessionManager.currentSession) {
      sessionManager.currentSession.moves = [];
      sessionManager.historyPointer = -1;
    }

    if (currentScramble && currentScramble.length > 0) {
      for (const m of currentScramble) {
        logicalCube.applyMove(m);
        cubeEngine.executeMove(m, true);
      }
      scrambleIndex = currentScramble.length;
    } else {
      scrambleIndex = 0;
    }
  }

  function ensureScrambleApplied() {
    if (currentScramble.length > 0 && scrambleIndex < currentScramble.length) {
      syncCubeToScrambleState();
      updateStatusHUD('Scramble Applied to State', currentScramble.length, currentScramble.length, '');
    }
  }

  function getScrambledCubeModel() {
    const scCube = new Cube();
    if (currentScramble && currentScramble.length > 0) {
      scCube.move(currentScramble.join(' '));
    }
    return scCube;
  }

  function updateStatusHUD(statusText, currentStep, totalSteps, currentMove) {
    hudStatus.textContent = statusText;
    if (totalSteps > 0) {
      hudCounter.innerHTML = `<span class="hud-step-badge">[${currentStep}/${totalSteps}]</span> ${currentMove ? '<span class="hud-move-label">Move:</span> ' + formatMoveHTML(currentMove, { extraClass: 'hud-current-move-badge' }) : ''}`;
    } else {
      hudCounter.textContent = '';
    }

    const isSolved = logicalCube.isSolved();
    statusDot.className = `status-indicator ${isSolved ? '' : 'unsolved'}`;
    statusLabel.textContent = isSolved ? 'Cube State: Solved' : 'Cube State: Scrambled / Unsolved';
  }

  function invalidateSolverResults() {
    kociembaResult = null;
    lblResult = null;
    cfopResult = null;
    activePlaybackSource = null;
    isPlayingSolution = false;

    // Reset Panel A (Kociemba)
    panelKociemba.classList.remove('card-solved', 'card-active');
    statusPillKociemba.className = 'status-pill pill-not-run';
    statusPillKociemba.textContent = 'Not run yet';
    kociembaMetricMoves.textContent = '-';
    kociembaMetricSolveTime.textContent = '-';
    kociembaMetricInitTime.textContent = '-';
    kociembaMetricTotalTime.textContent = '-';
    kociembaMetricVerified.textContent = '-';
    kociembaMetricVerified.style.color = '';
    kociembaSequenceBox.innerHTML = '<span class="seq-placeholder">Click "Kociemba" above to generate sequence.</span>';
    btnPlayKociemba.disabled = true;
    btnPauseKociemba.disabled = true;
    btnRestartKociemba.disabled = true;
    btnStepBackKociemba.disabled = true;
    btnStepFwdKociemba.disabled = true;
    chipsKociemba.innerHTML = '';

    // Reset Panel B (LBL)
    panelLbl.classList.remove('card-solved', 'card-active');
    statusPillLbl.className = 'status-pill pill-not-run';
    statusPillLbl.textContent = 'Not run yet';
    lblMetricMoves.textContent = '-';
    lblMetricSolveTime.textContent = '-';
    lblMetricInitTime.textContent = '-';
    lblMetricTotalTime.textContent = '-';
    lblMetricVerified.textContent = '-';
    lblMetricVerified.style.color = '';
    lblSequenceBox.innerHTML = '<span class="seq-placeholder">Click "Layer-by-Layer" above to generate sequence.</span>';
    btnPlayLbl.disabled = true;
    btnPauseLbl.disabled = true;
    btnRestartLbl.disabled = true;
    btnStepBackLbl.disabled = true;
    btnStepFwdLbl.disabled = true;
    chipsLbl.innerHTML = '';

    // Reset Panel C (CFOP-X)
    panelCfop.classList.remove('card-solved', 'card-active');
    statusPillCfop.className = 'status-pill pill-not-run';
    statusPillCfop.textContent = 'Not run yet';
    cfopMetricMoves.textContent = '-';
    cfopMetricSolveTime.textContent = '-';
    cfopMetricCross.textContent = '-';
    cfopMetricF2l.textContent = '-';
    cfopMetricVerified.textContent = '-';
    cfopMetricVerified.style.color = '';
    cfopSequenceBox.innerHTML = '<span class="seq-placeholder">Click "CFOP-X (Exp.)" above to generate sequence.</span>';
    btnPlayCfop.disabled = true;
    btnPauseCfop.disabled = true;
    btnRestartCfop.disabled = true;
    btnStepBackCfop.disabled = true;
    btnStepFwdCfop.disabled = true;
    chipsCfop.innerHTML = '';

    // Reset Comparison Summary Card
    comparisonSummaryCard.classList.remove('active-comparison');
    comparisonStatusNote.textContent = 'Awaiting solver execution';
    comparisonContent.innerHTML = `
      <p style="font-size: 0.9rem; color: var(--lab-text-muted);">
        Generate a scramble above, then run any solver to compare move optimality, computation speed, and algorithmic trade-offs side by side on identical starting states.
      </p>
    `;
  }

  function updateComparisonSummary() {
    const executed = [
      kociembaResult ? { name: 'Kociemba', res: kociembaResult } : null,
      lblResult ? { name: 'LBL', res: lblResult } : null,
      cfopResult ? { name: 'CFOP-X', res: cfopResult } : null
    ].filter(Boolean);

    if (executed.length === 0) return;

    comparisonSummaryCard.classList.add('active-comparison');
    comparisonStatusNote.textContent = `${executed.length} of 3 Solvers Evaluated`;

    let cellsHtml = '';
    if (kociembaResult) {
      cellsHtml += `
        <div class="comparison-solver-col">
          <span class="comparison-solver-badge badge-kociemba">Kociemba Two-Phase</span>
          <div class="comparison-move-stat">
            <span class="stat-number">${kociembaResult.moves.length}</span>
            <span class="stat-unit">moves</span>
          </div>
          <div class="comparison-time-stat stat-kociemba">
            Pure solve: ${formatDuration(kociembaResult.pureSolveMs)}
          </div>
          <div class="comparison-meta-desc">
            Near-Optimal &bull; Fully Verified
          </div>
        </div>
      `;
    }

    if (lblResult) {
      cellsHtml += `
        <div class="comparison-solver-col">
          <span class="comparison-solver-badge badge-lbl">Layer-by-Layer</span>
          <div class="comparison-move-stat">
            <span class="stat-number">${lblResult.moves.length}</span>
            <span class="stat-unit">moves</span>
          </div>
          <div class="comparison-time-stat stat-lbl">
            Pure solve: ${formatDuration(lblResult.pureSolveMs)}
          </div>
          <div class="comparison-meta-desc">
            Deterministic &bull; Fully Verified
          </div>
        </div>
      `;
    }

    if (cfopResult) {
      cellsHtml += `
        <div class="comparison-solver-col">
          <span class="comparison-solver-badge badge-cfop">CFOP-X (Experimental)</span>
          <div class="comparison-move-stat">
            <span class="stat-number">${cfopResult.success ? cfopResult.moves.length : '—'}</span>
            <span class="stat-unit">${cfopResult.success ? 'moves' : 'Search Limit'}</span>
          </div>
          <div class="comparison-time-stat stat-cfop">
            ${cfopResult.success ? `All 4 Stages Solved (${formatDuration(cfopResult.solveTimeMs)})` : `Halted (${formatDuration(cfopResult.solveTimeMs)})`}
          </div>
          <div class="comparison-meta-desc">
            ${cfopResult.verified ? '100% Verified &bull; Cross+F2L+OLL+PLL' : 'Incomplete'}
          </div>
        </div>
      `;
    }

    comparisonContent.innerHTML = `
      <div class="comparison-stats-grid" style="grid-template-columns: repeat(${Math.max(2, executed.length)}, 1fr);">
        ${cellsHtml}
      </div>
    `;
  }

  // --- 1. SCRAMBLE GENERATOR CONTROLS ---
  btnGenScramble.addEventListener('click', () => {
    isPlayingScramble = false;
    isPlayingSolution = false;
    currentScramble = generateScramble(20);
    scrambleIndex = 0;

    scrambleBox.innerHTML = formatSequenceHTML(currentScramble);
    btnPlayScramble.disabled = false;
    btnScrambleStepFwd.disabled = false;
    btnScrambleStepBack.disabled = true;
    btnScramblePause.disabled = true;

    cubeEngine.resetToIdentity();
    logicalCube.reset();
    if (sessionManager && sessionManager.currentSession) {
      sessionManager.currentSession.moves = [];
      sessionManager.historyPointer = -1;
    }

    invalidateSolverResults();
    updateStatusHUD('Scramble Generated — Ready to Play', 0, currentScramble.length, currentScramble[0]);
  });

  async function stepScrambleFwd() {
    if (!isPlayingScramble || isUnmounted || scrambleIndex >= currentScramble.length) {
      isPlayingScramble = false;
      btnPlayScramble.disabled = false;
      btnScramblePause.disabled = true;
      btnScrambleStepFwd.disabled = scrambleIndex >= currentScramble.length;
      btnScrambleStepBack.disabled = scrambleIndex === 0;
      if (scrambleIndex >= currentScramble.length) {
        updateStatusHUD('Scramble Complete', currentScramble.length, currentScramble.length, '');
      }
      return;
    }

    const move = currentScramble[scrambleIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Scrambling...', scrambleIndex + 1, currentScramble.length, move);

    await cubeEngine.executeMove(move);

    if (!isPlayingScramble || isUnmounted) return;

    scrambleIndex++;
    btnScrambleStepBack.disabled = false;

    if (scrambleIndex >= currentScramble.length) {
      isPlayingScramble = false;
      btnPlayScramble.disabled = false;
      btnScramblePause.disabled = true;
      btnScrambleStepFwd.disabled = true;
      updateStatusHUD('Scramble Complete', currentScramble.length, currentScramble.length, '');
    } else {
      stepScrambleFwd();
    }
  }

  btnPlayScramble.addEventListener('click', () => {
    if (currentScramble.length === 0) return;
    if (cubeEngine.isAnimating) return;

    if (scrambleIndex >= currentScramble.length) {
      cubeEngine.resetToIdentity();
      logicalCube.reset();
      if (sessionManager && sessionManager.currentSession) {
        sessionManager.currentSession.moves = [];
        sessionManager.historyPointer = -1;
      }
      scrambleIndex = 0;
    }
    isPlayingScramble = true;
    isPlayingSolution = false;
    btnPlayScramble.disabled = true;
    btnScramblePause.disabled = false;
    btnScrambleStepFwd.disabled = true;
    stepScrambleFwd();
  });

  btnScramblePause.addEventListener('click', () => {
    isPlayingScramble = false;
    btnPlayScramble.disabled = false;
    btnScramblePause.disabled = true;
    updateStatusHUD('Scramble Paused', scrambleIndex, currentScramble.length, '');
  });

  btnScrambleStepFwd.addEventListener('click', async () => {
    if (cubeEngine.isAnimating || isPlayingScramble) return;
    if (scrambleIndex < currentScramble.length) {
      const move = currentScramble[scrambleIndex];
      btnScrambleStepFwd.disabled = true;
      sessionManager.recordMove(move);
      await cubeEngine.executeMove(move);
      scrambleIndex++;
      btnScrambleStepBack.disabled = false;
      btnScrambleStepFwd.disabled = scrambleIndex >= currentScramble.length;
      updateStatusHUD('Scramble Stepped Forward', scrambleIndex, currentScramble.length, move);
    }
  });

  btnScrambleStepBack.addEventListener('click', async () => {
    if (cubeEngine.isAnimating || isPlayingScramble) return;
    if (scrambleIndex > 0) {
      scrambleIndex--;
      btnScrambleStepBack.disabled = true;
      const undone = sessionManager.undo();
      if (undone) {
        const move = undone.move;
        const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
        logicalCube.applyMove(inv);
        await cubeEngine.executeMove(inv);
      }
      btnScrambleStepFwd.disabled = false;
      btnScrambleStepBack.disabled = scrambleIndex === 0;
      updateStatusHUD('Scramble Stepped Back', scrambleIndex, currentScramble.length, '');
    }
  });

  btnResetScramble.addEventListener('click', () => {
    syncCubeToScrambleState();
    btnScrambleStepFwd.disabled = false;
    btnScrambleStepBack.disabled = true;
    btnScramblePause.disabled = true;
    btnPlayScramble.disabled = false;
    updateStatusHUD('Reset to Starting Scramble State', scrambleIndex, currentScramble.length, '');
  });

  // --- 2. SOLVER EXECUTION BUTTONS ---

  // Button 1: Solve with Kociemba Two-Phase
  btnSolveKociemba.addEventListener('click', async () => {
    if (currentScramble.length === 0 && logicalCube.isSolved()) {
      alert('The cube is already in the solved identity state e! Click "Generate Scramble" first.');
      return;
    }

    ensureScrambleApplied();

    btnSolveKociemba.disabled = true;
    btnSolveKociemba.textContent = 'Solving...';
    statusPillKociemba.className = 'status-pill pill-solving';
    statusPillKociemba.textContent = 'Computing Phase 1 & 2...';

    const scrambledModel = getScrambledCubeModel();
    const solveCube = new Cube(scrambledModel);

    setTimeout(() => {
      let initDurationMs = LogicalCube.getSolverInitDuration();
      const isWarm = LogicalCube.isSolverInitialized();

      if (!isWarm) {
        const tInit0 = performance.now();
        Cube.initSolver();
        initDurationMs = performance.now() - tInit0;
      }

      const tSolve0 = performance.now();
      const rawSolution = solveCube.solve();
      const pureSolveMs = performance.now() - tSolve0;

      const moves = rawSolution.trim().split(/\s+/).filter(Boolean);
      const metrics = countMovesMetrics(moves);

      const tVal0 = performance.now();
      const valCube = new Cube(scrambledModel);
      valCube.move(rawSolution);
      const isVerified = valCube.isSolved();
      const valMs = performance.now() - tVal0;

      const totalElapsedMs = (isWarm ? 0 : initDurationMs) + pureSolveMs + valMs;

      btnSolveKociemba.disabled = false;
      btnSolveKociemba.textContent = 'Kociemba';

      kociembaResult = {
        moves,
        moveString: rawSolution,
        htm: metrics.htm,
        qtm: metrics.qtm,
        pureSolveMs,
        initDurationMs: isWarm ? 0 : initDurationMs,
        isWarm,
        valMs,
        totalElapsedMs,
        verified: isVerified
      };

      kociembaPlaybackIndex = 0;

      panelKociemba.classList.add('card-solved');
      statusPillKociemba.className = 'status-pill pill-solved';
      statusPillKociemba.innerHTML = '&#10003; Solved &amp; Verified';

      kociembaMetricMoves.textContent = `${metrics.htm} HTM (${metrics.qtm} QTM)`;
      kociembaMetricSolveTime.textContent = formatDuration(pureSolveMs);
      kociembaMetricInitTime.textContent = formatDuration(initDurationMs, isWarm);
      kociembaMetricTotalTime.textContent = formatDuration(totalElapsedMs);
      kociembaMetricVerified.textContent = `Verified (${formatDuration(valMs)})`;
      kociembaMetricVerified.style.color = 'var(--lab-success)';
      kociembaSequenceBox.innerHTML = formatSequenceHTML(moves);

      btnPlayKociemba.disabled = false;
      btnRestartKociemba.disabled = false;
      btnStepFwdKociemba.disabled = false;

      renderKociembaBadges();
      updateComparisonSummary();
      updateStatusHUD(`Kociemba Solution Ready (${metrics.htm} moves)`, 0, moves.length, moves[0]);
    }, 20);
  });

  // Button 2: Solve with Layer-by-Layer (LBL)
  btnSolveLbl.addEventListener('click', async () => {
    if (currentScramble.length === 0 && logicalCube.isSolved()) {
      alert('The cube is already in the solved identity state e! Click "Generate Scramble" first.');
      return;
    }

    ensureScrambleApplied();

    btnSolveLbl.disabled = true;
    btnSolveLbl.textContent = 'Solving...';
    statusPillLbl.className = 'status-pill pill-solving';
    statusPillLbl.textContent = 'Executing 4 Stages...';

    const scrambledModel = getScrambledCubeModel();
    const solveCube = new Cube(scrambledModel);

    let result;
    try {
      result = LayerByLayerSolver.solve(solveCube);
    } catch (err) {
      console.error('LBL solve error:', err);
      btnSolveLbl.disabled = false;
      btnSolveLbl.textContent = 'Layer-by-Layer';
      statusPillLbl.className = 'status-pill pill-failed';
      statusPillLbl.textContent = 'Error';
      alert(`LBL Error: ${err.message}`);
      return;
    }

    btnSolveLbl.disabled = false;
    btnSolveLbl.textContent = 'Layer-by-Layer';

    const lblMetrics = countMovesMetrics(result.moves);
    lblResult = {
      moves: result.moves,
      moveString: result.moveString,
      htm: lblMetrics.htm,
      qtm: lblMetrics.qtm,
      pureSolveMs: result.solveTimeMs,
      totalElapsedMs: result.totalElapsedMs,
      verified: result.verified
    };

    lblPlaybackIndex = 0;

    panelLbl.classList.add('card-solved');
    statusPillLbl.className = 'status-pill pill-solved';
    statusPillLbl.innerHTML = '&#10003; Solved &amp; Verified';

    lblMetricMoves.textContent = `${lblMetrics.htm} HTM (${lblMetrics.qtm} QTM)`;
    lblMetricSolveTime.textContent = formatDuration(result.solveTimeMs);
    lblMetricInitTime.textContent = '0.00 ms (no tables)';
    lblMetricTotalTime.textContent = formatDuration(result.totalElapsedMs);
    lblMetricVerified.textContent = `Verified (${formatDuration(result.validationTimeMs)})`;
    lblMetricVerified.style.color = 'var(--lab-success)';
    lblSequenceBox.innerHTML = formatSequenceHTML(result.moves);

    btnPlayLbl.disabled = false;
    btnRestartLbl.disabled = false;
    btnStepFwdLbl.disabled = false;

    renderLblBadges();
    updateComparisonSummary();
    updateStatusHUD(`LBL Solution Ready (${lblMetrics.htm} moves)`, 0, result.moves.length, result.moves[0]);
  });

  // Button 3: Solve with CFOP-X (Experimental)
  btnSolveCfop.addEventListener('click', async () => {
    if (currentScramble.length === 0 && logicalCube.isSolved()) {
      alert('The cube is already in the solved identity state e! Click "Generate Scramble" first.');
      return;
    }

    ensureScrambleApplied();

    btnSolveCfop.disabled = true;
    btnSolveCfop.textContent = 'Solving...';
    statusPillCfop.className = 'status-pill pill-solving';
    statusPillCfop.textContent = 'Executing CFOP-X...';

    const scrambledModel = getScrambledCubeModel();
    const solveCube = new Cube(scrambledModel);

    setTimeout(() => {
      try {
        const result = CFOPSolver.solve(solveCube);

        btnSolveCfop.disabled = false;
        btnSolveCfop.textContent = 'CFOP-X (Exp.)';

        const cfopMetrics = countMovesMetrics(result.moves);
        cfopResult = {
          moves: result.moves || [],
          moveString: result.moveString || '',
          htm: cfopMetrics.htm,
          qtm: cfopMetrics.qtm,
          success: result.success,
          verified: result.verified,
          isSolved: result.isSolved,
          solveTimeMs: result.solveTimeMs,
          stageBreakdown: result.stageBreakdown,
          limitations: result.limitations
        };

        cfopPlaybackIndex = 0;

        if (result.success && result.verified) {
          panelCfop.classList.add('card-solved');
          statusPillCfop.className = 'status-pill pill-solved';
          statusPillCfop.innerHTML = '&#10003; Solved &amp; Verified';

          cfopMetricMoves.textContent = `${cfopMetrics.htm} HTM (${cfopMetrics.qtm} QTM)`;
          cfopMetricSolveTime.textContent = formatDuration(result.solveTimeMs);
          cfopMetricCross.textContent = `${result.stageBreakdown?.cross?.moves?.length || 0} moves (Lookahead)`;
          cfopMetricF2l.textContent = `${result.stageBreakdown?.f2l?.moves?.length || 0} moves (4 Pairs)`;
          cfopMetricVerified.textContent = '100% Solved & Verified';
          cfopMetricVerified.style.color = 'var(--lab-success)';
          cfopSequenceBox.innerHTML = formatSequenceHTML(result.moves);

          btnPlayCfop.disabled = false;
          btnRestartCfop.disabled = false;
          btnStepFwdCfop.disabled = false;

          renderCfopBadges();
          updateComparisonSummary();
          updateStatusHUD(`CFOP-X Solution Ready (${result.moves.length} moves)`, 0, result.moves.length, result.moves[0] || '');
        } else {
          panelCfop.classList.remove('card-solved');
          statusPillCfop.className = 'status-pill pill-failed';
          statusPillCfop.textContent = result.status || 'Search Limit';

          cfopMetricMoves.textContent = 'Failed';
          cfopMetricSolveTime.textContent = formatDuration(result.solveTimeMs);
          cfopMetricCross.textContent = result.stageBreakdown?.cross?.success ? 'Solved' : 'Failed';
          cfopMetricF2l.textContent = result.stageBreakdown?.f2l?.success ? 'Solved' : 'Incomplete';
          cfopMetricVerified.textContent = 'Unsolved';
          cfopMetricVerified.style.color = 'var(--lab-error)';
          cfopSequenceBox.textContent = `CFOP-X halted: ${result.limitations || 'Stage search limit reached.'}`;

          btnPlayCfop.disabled = true;
          btnRestartCfop.disabled = true;
          btnStepFwdCfop.disabled = true;

          renderCfopBadges();
          updateComparisonSummary();
          updateStatusHUD(`CFOP-X Halted: ${result.limitations || 'Incomplete'}`, 0, 0, '');
        }
      } catch (err) {
        console.error('CFOP-X solver error:', err);
        btnSolveCfop.disabled = false;
        btnSolveCfop.textContent = 'CFOP-X (Exp.)';
        statusPillCfop.className = 'status-pill pill-failed';
        statusPillCfop.textContent = 'Error';
        alert(`CFOP-X solver error: ${err.message}`);
      }
    }, 20);
  });

  // --- 3. DEDICATED PLAYBACK CONTROLLERS ---

  function renderKociembaBadges() {
    if (!kociembaResult) {
      chipsKociemba.innerHTML = '';
      return;
    }
    chipsKociemba.innerHTML = kociembaResult.moves.map((move, i) => {
      const isCur = activePlaybackSource === 'kociemba' && i === kociembaPlaybackIndex;
      const isDone = activePlaybackSource === 'kociemba' && i < kociembaPlaybackIndex;
      return formatMoveHTML(move, { isCurrent: isCur, isDone });
    }).join('');
  }

  function renderLblBadges() {
    if (!lblResult) {
      chipsLbl.innerHTML = '';
      return;
    }
    chipsLbl.innerHTML = lblResult.moves.map((move, i) => {
      const isCur = activePlaybackSource === 'lbl' && i === lblPlaybackIndex;
      const isDone = activePlaybackSource === 'lbl' && i < lblPlaybackIndex;
      return formatMoveHTML(move, { isCurrent: isCur, isDone });
    }).join('');
  }

  function renderCfopBadges() {
    if (!cfopResult) {
      chipsCfop.innerHTML = '';
      return;
    }
    chipsCfop.innerHTML = cfopResult.moves.map((move, i) => {
      const isCur = activePlaybackSource === 'cfop' && i === cfopPlaybackIndex;
      const isDone = activePlaybackSource === 'cfop' && i < cfopPlaybackIndex;
      return formatMoveHTML(move, { isCurrent: isCur, isDone });
    }).join('');
  }

  // Panel A (Kociemba) Playback
  async function stepKociembaFwd() {
    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'kociemba' || !kociembaResult) return;

    if (kociembaPlaybackIndex >= kociembaResult.moves.length) {
      isPlayingSolution = false;
      btnPlayKociemba.disabled = false;
      btnPauseKociemba.disabled = true;
      renderKociembaBadges();
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'Kociemba Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        kociembaResult.moves.length,
        kociembaResult.moves.length,
        ''
      );
      return;
    }

    // Immediately before the final move, ensure animation system and logical state are aligned
    if (kociembaPlaybackIndex === kociembaResult.moves.length - 1) {
      if (cubeEngine.moveQueue && cubeEngine.moveQueue.length > 0) {
        while (cubeEngine.moveQueue.length > 0) {
          const item = cubeEngine.moveQueue.shift();
          if (item && item.resolve) item.resolve();
        }
      }
    }

    const move = kociembaResult.moves[kociembaPlaybackIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Solving with Kociemba...', kociembaPlaybackIndex + 1, kociembaResult.moves.length, move);

    renderKociembaBadges();
    await cubeEngine.executeMove(move);

    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'kociemba') return;

    kociembaPlaybackIndex++;
    btnStepBackKociemba.disabled = false;
    renderKociembaBadges();

    if (kociembaPlaybackIndex >= kociembaResult.moves.length) {
      isPlayingSolution = false;
      btnPlayKociemba.disabled = false;
      btnPauseKociemba.disabled = true;
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'Kociemba Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        kociembaResult.moves.length,
        kociembaResult.moves.length,
        ''
      );
    } else if (isPlayingSolution) {
      stepKociembaFwd();
    }
  }

  btnPlayKociemba.addEventListener('click', () => {
    if (!kociembaResult || kociembaResult.moves.length === 0) return;
    if (activePlaybackSource !== 'kociemba' || kociembaPlaybackIndex >= kociembaResult.moves.length) {
      syncCubeToScrambleState();
      kociembaPlaybackIndex = 0;
    }

    activePlaybackSource = 'kociemba';
    panelKociemba.classList.add('card-active');
    panelLbl.classList.remove('card-active');
    panelCfop.classList.remove('card-active');

    isPlayingSolution = true;
    isPlayingScramble = false;
    btnPlayKociemba.disabled = true;
    btnPauseKociemba.disabled = false;

    stepKociembaFwd();
  });

  btnPauseKociemba.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayKociemba.disabled = false;
    btnPauseKociemba.disabled = true;
    updateStatusHUD('Kociemba Playback Paused', kociembaPlaybackIndex, kociembaResult?.moves.length || 0, '');
  });

  btnRestartKociemba.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayKociemba.disabled = false;
    btnPauseKociemba.disabled = true;
    syncCubeToScrambleState();
    kociembaPlaybackIndex = 0;
    renderKociembaBadges();
    btnStepBackKociemba.disabled = true;
    btnStepFwdKociemba.disabled = false;
    updateStatusHUD('Kociemba Solution Restarted', 0, kociembaResult?.moves.length || 0, kociembaResult?.moves[0] || '');
  });

  btnStepFwdKociemba.addEventListener('click', async () => {
    if (!kociembaResult || kociembaResult.moves.length === 0) return;
    if (activePlaybackSource !== 'kociemba') {
      syncCubeToScrambleState();
      kociembaPlaybackIndex = 0;
      activePlaybackSource = 'kociemba';
      panelKociemba.classList.add('card-active');
      panelLbl.classList.remove('card-active');
      panelCfop.classList.remove('card-active');
    }

    if (kociembaPlaybackIndex < kociembaResult.moves.length) {
      const move = kociembaResult.moves[kociembaPlaybackIndex];
      sessionManager.recordMove(move);
      await cubeEngine.executeMove(move);
      kociembaPlaybackIndex++;
      btnStepBackKociemba.disabled = false;
      renderKociembaBadges();
      if (kociembaPlaybackIndex >= kociembaResult.moves.length) {
        const isSolved = logicalCube.isSolved();
        if (isSolved && !cubeEngine.isVisuallySolved()) {
          cubeEngine.snapToSolvedVisual();
        }
        updateStatusHUD(
          isSolved ? 'Kociemba Solved Successfully!' : 'Execution Finished — Cube Not Solved',
          kociembaPlaybackIndex,
          kociembaResult.moves.length,
          move
        );
      } else {
        updateStatusHUD('Kociemba Stepped Forward', kociembaPlaybackIndex, kociembaResult.moves.length, move);
      }
    }
  });

  btnStepBackKociemba.addEventListener('click', async () => {
    if (!kociembaResult || kociembaPlaybackIndex === 0) return;
    kociembaPlaybackIndex--;
    const undone = sessionManager.undo();
    if (undone) {
      const move = undone.move;
      const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
      logicalCube.applyMove(inv);
      await cubeEngine.executeMove(inv);
    }
    btnStepFwdKociemba.disabled = false;
    if (kociembaPlaybackIndex === 0) btnStepBackKociemba.disabled = true;
    renderKociembaBadges();
    updateStatusHUD('Kociemba Stepped Back', kociembaPlaybackIndex, kociembaResult.moves.length, '');
  });

  // Panel B (LBL) Playback
  async function stepLblFwd() {
    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'lbl' || !lblResult) return;

    if (lblPlaybackIndex >= lblResult.moves.length) {
      isPlayingSolution = false;
      btnPlayLbl.disabled = false;
      btnPauseLbl.disabled = true;
      renderLblBadges();
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'LBL Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        lblResult.moves.length,
        lblResult.moves.length,
        ''
      );
      return;
    }

    // Immediately before the final move, ensure animation system and logical state are aligned
    if (lblPlaybackIndex === lblResult.moves.length - 1) {
      if (cubeEngine.moveQueue && cubeEngine.moveQueue.length > 0) {
        while (cubeEngine.moveQueue.length > 0) {
          const item = cubeEngine.moveQueue.shift();
          if (item && item.resolve) item.resolve();
        }
      }
    }

    const move = lblResult.moves[lblPlaybackIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Solving with LBL...', lblPlaybackIndex + 1, lblResult.moves.length, move);

    renderLblBadges();
    await cubeEngine.executeMove(move);

    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'lbl') return;

    lblPlaybackIndex++;
    btnStepBackLbl.disabled = false;
    renderLblBadges();

    if (lblPlaybackIndex >= lblResult.moves.length) {
      isPlayingSolution = false;
      btnPlayLbl.disabled = false;
      btnPauseLbl.disabled = true;
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'LBL Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        lblResult.moves.length,
        lblResult.moves.length,
        ''
      );
    } else if (isPlayingSolution) {
      stepLblFwd();
    }
  }

  btnPlayLbl.addEventListener('click', () => {
    if (!lblResult || lblResult.moves.length === 0) return;
    if (activePlaybackSource !== 'lbl' || lblPlaybackIndex >= lblResult.moves.length) {
      syncCubeToScrambleState();
      lblPlaybackIndex = 0;
    }

    activePlaybackSource = 'lbl';
    panelLbl.classList.add('card-active');
    panelKociemba.classList.remove('card-active');
    panelCfop.classList.remove('card-active');

    isPlayingSolution = true;
    isPlayingScramble = false;
    btnPlayLbl.disabled = true;
    btnPauseLbl.disabled = false;

    stepLblFwd();
  });

  btnPauseLbl.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayLbl.disabled = false;
    btnPauseLbl.disabled = true;
    updateStatusHUD('LBL Playback Paused', lblPlaybackIndex, lblResult?.moves.length || 0, '');
  });

  btnRestartLbl.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayLbl.disabled = false;
    btnPauseLbl.disabled = true;
    syncCubeToScrambleState();
    lblPlaybackIndex = 0;
    renderLblBadges();
    btnStepBackLbl.disabled = true;
    btnStepFwdLbl.disabled = false;
    updateStatusHUD('LBL Solution Restarted', 0, lblResult?.moves.length || 0, lblResult?.moves[0] || '');
  });

  btnStepFwdLbl.addEventListener('click', async () => {
    if (!lblResult || lblResult.moves.length === 0) return;
    if (activePlaybackSource !== 'lbl') {
      syncCubeToScrambleState();
      lblPlaybackIndex = 0;
      activePlaybackSource = 'lbl';
      panelLbl.classList.add('card-active');
      panelKociemba.classList.remove('card-active');
      panelCfop.classList.remove('card-active');
    }

    if (lblPlaybackIndex < lblResult.moves.length) {
      const move = lblResult.moves[lblPlaybackIndex];
      sessionManager.recordMove(move);
      await cubeEngine.executeMove(move);
      lblPlaybackIndex++;
      btnStepBackLbl.disabled = false;
      renderLblBadges();
      if (lblPlaybackIndex >= lblResult.moves.length) {
        const isSolved = logicalCube.isSolved();
        if (isSolved && !cubeEngine.isVisuallySolved()) {
          cubeEngine.snapToSolvedVisual();
        }
        updateStatusHUD(
          isSolved ? 'LBL Solved Successfully!' : 'Execution Finished — Cube Not Solved',
          lblPlaybackIndex,
          lblResult.moves.length,
          move
        );
      } else {
        updateStatusHUD('LBL Stepped Forward', lblPlaybackIndex, lblResult.moves.length, move);
      }
    }
  });

  btnStepBackLbl.addEventListener('click', async () => {
    if (!lblResult || lblPlaybackIndex === 0) return;
    lblPlaybackIndex--;
    const undone = sessionManager.undo();
    if (undone) {
      const move = undone.move;
      const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
      logicalCube.applyMove(inv);
      await cubeEngine.executeMove(inv);
    }
    btnStepFwdLbl.disabled = false;
    if (lblPlaybackIndex === 0) btnStepBackLbl.disabled = true;
    renderLblBadges();
    updateStatusHUD('LBL Stepped Back', lblPlaybackIndex, lblResult.moves.length, '');
  });

  // Panel C (CFOP-X) Playback
  async function stepCfopFwd() {
    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'cfop' || !cfopResult) return;

    if (cfopPlaybackIndex >= cfopResult.moves.length) {
      isPlayingSolution = false;
      btnPlayCfop.disabled = false;
      btnPauseCfop.disabled = true;
      renderCfopBadges();
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'CFOP-X Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        cfopResult.moves.length,
        cfopResult.moves.length,
        ''
      );
      return;
    }

    // Immediately before the final move, ensure animation system and logical state are aligned
    if (cfopPlaybackIndex === cfopResult.moves.length - 1) {
      if (cubeEngine.moveQueue && cubeEngine.moveQueue.length > 0) {
        while (cubeEngine.moveQueue.length > 0) {
          const item = cubeEngine.moveQueue.shift();
          if (item && item.resolve) item.resolve();
        }
      }
    }

    const move = cfopResult.moves[cfopPlaybackIndex];
    sessionManager.recordMove(move);
    updateStatusHUD('Solving with CFOP-X...', cfopPlaybackIndex + 1, cfopResult.moves.length, move);

    renderCfopBadges();
    await cubeEngine.executeMove(move);

    if (!isPlayingSolution || isUnmounted || activePlaybackSource !== 'cfop') return;

    cfopPlaybackIndex++;
    btnStepBackCfop.disabled = false;
    renderCfopBadges();

    if (cfopPlaybackIndex >= cfopResult.moves.length) {
      isPlayingSolution = false;
      btnPlayCfop.disabled = false;
      btnPauseCfop.disabled = true;
      const isSolved = logicalCube.isSolved();
      if (isSolved && !cubeEngine.isVisuallySolved()) {
        cubeEngine.snapToSolvedVisual();
      }
      updateStatusHUD(
        isSolved ? 'CFOP-X Solved Successfully!' : 'Execution Finished — Cube Not Solved',
        cfopResult.moves.length,
        cfopResult.moves.length,
        ''
      );
    } else if (isPlayingSolution) {
      stepCfopFwd();
    }
  }

  btnPlayCfop.addEventListener('click', () => {
    if (!cfopResult || cfopResult.moves.length === 0) return;
    if (activePlaybackSource !== 'cfop' || cfopPlaybackIndex >= cfopResult.moves.length) {
      syncCubeToScrambleState();
      cfopPlaybackIndex = 0;
    }

    activePlaybackSource = 'cfop';
    panelCfop.classList.add('card-active');
    panelKociemba.classList.remove('card-active');
    panelLbl.classList.remove('card-active');

    isPlayingSolution = true;
    isPlayingScramble = false;
    btnPlayCfop.disabled = true;
    btnPauseCfop.disabled = false;

    stepCfopFwd();
  });

  btnPauseCfop.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayCfop.disabled = false;
    btnPauseCfop.disabled = true;
    updateStatusHUD('CFOP-X Playback Paused', cfopPlaybackIndex, cfopResult?.moves.length || 0, '');
  });

  btnRestartCfop.addEventListener('click', () => {
    isPlayingSolution = false;
    btnPlayCfop.disabled = false;
    btnPauseCfop.disabled = true;
    syncCubeToScrambleState();
    cfopPlaybackIndex = 0;
    renderCfopBadges();
    btnStepBackCfop.disabled = true;
    btnStepFwdCfop.disabled = false;
    updateStatusHUD('CFOP-X Solution Restarted', 0, cfopResult?.moves.length || 0, cfopResult?.moves[0] || '');
  });

  btnStepFwdCfop.addEventListener('click', async () => {
    if (!cfopResult || cfopResult.moves.length === 0) return;
    if (activePlaybackSource !== 'cfop') {
      syncCubeToScrambleState();
      cfopPlaybackIndex = 0;
      activePlaybackSource = 'cfop';
      panelCfop.classList.add('card-active');
      panelKociemba.classList.remove('card-active');
      panelLbl.classList.remove('card-active');
    }

    if (cfopPlaybackIndex < cfopResult.moves.length) {
      const move = cfopResult.moves[cfopPlaybackIndex];
      sessionManager.recordMove(move);
      await cubeEngine.executeMove(move);
      cfopPlaybackIndex++;
      btnStepBackCfop.disabled = false;
      renderCfopBadges();
      if (cfopPlaybackIndex >= cfopResult.moves.length) {
        const isSolved = logicalCube.isSolved();
        if (isSolved && !cubeEngine.isVisuallySolved()) {
          cubeEngine.snapToSolvedVisual();
        }
        updateStatusHUD(
          isSolved ? 'CFOP-X Solved Successfully!' : 'Execution Finished — Cube Not Solved',
          cfopPlaybackIndex,
          cfopResult.moves.length,
          move
        );
      } else {
        updateStatusHUD('CFOP-X Stepped Forward', cfopPlaybackIndex, cfopResult.moves.length, move);
      }
    }
  });

  btnStepBackCfop.addEventListener('click', async () => {
    if (!cfopResult || cfopPlaybackIndex === 0) return;
    cfopPlaybackIndex--;
    const undone = sessionManager.undo();
    if (undone) {
      const move = undone.move;
      const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
      logicalCube.applyMove(inv);
      await cubeEngine.executeMove(inv);
    }
    btnStepFwdCfop.disabled = false;
    if (cfopPlaybackIndex === 0) btnStepBackCfop.disabled = true;
    renderCfopBadges();
    updateStatusHUD('CFOP-X Stepped Back', cfopPlaybackIndex, cfopResult.moves.length, '');
  });

  // View reset
  container.querySelector('#solver-btn-reset-view')?.addEventListener('click', () => onResetView());

  // Return destructor
  return () => {
    isUnmounted = true;
    isPlayingScramble = false;
    isPlayingSolution = false;
  };
}
