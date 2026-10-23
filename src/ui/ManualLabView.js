/**
 * ManualLabView - Manual Cube Lab Interface
 * Implements Section 6 & Section 8 of the specification with Batch 2 enhancements:
 * - Fix automatic page scrolling: scroll history internally, avoid document scroll jumps.
 * - Solve Cube action: genuine solution of current manually scrambled state via Kociemba solver.
 * - Clear, accurate move controls and feedback.
 */

import { FACE_NAMES, MOVE_DIRECTIONS } from '../core/constants.js';
import { extractPermutationCycles } from '../core/GroupTheory.js';
import { LogicalCube } from '../core/LogicalCube.js';
import { formatMoveHTML } from './notationFormatter.js';

export function renderManualLabView(container, {
  cubeEngine,
  logicalCube,
  sessionManager,
  onExecuteMove,
  onUndo,
  onRedo,
  onResetCube,
  onResetView,
  onStartSession,
  onEndSession,
  onSelectHistory,
  onSolveCube
}) {
  container.innerHTML = `
    <div class="view-lab">
      <div class="lab-main-layout">
        <!-- LEFT COLUMN: 3D CUBE & MOVE HISTORY -->
        <div class="lab-viewport-column">
          <div class="cube-viewport-panel">
            <div class="viewport-toolbar">
              <div class="viewport-title-area">
                <div class="status-indicator ${logicalCube.isSolved() ? '' : 'unsolved'}" id="cube-status-dot"></div>
                <span class="viewport-heading" id="cube-status-label">
                  ${logicalCube.isSolved() ? 'Cube State: Solved (Identity e)' : 'Cube State: Permuted'}
                </span>
              </div>

              <div class="viewport-controls-group">
                <button class="btn-icon-subtle" id="btn-reset-view" title="Reset Camera Orbit and Zoom">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Reset View
                </button>
                <button class="btn-icon-subtle" id="btn-reset-cube" title="Reset Cube to Solved State">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  Reset Cube
                </button>
              </div>
            </div>

            <!-- 3D Canvas Mount -->
            <div class="three-canvas-container" id="cube-3d-viewport">
              <div class="viewport-overlay-hint">Left-drag to rotate camera &bull; Right-drag to pan &bull; Click any sticker to select face</div>
            </div>

            <!-- Sticker Selection HUD -->
            <div class="selection-hud-card" id="selection-hud">
              <div class="selection-info-cluster">
                <span style="color: var(--lab-text-muted);">Selected Sticker:</span>
                <span class="selected-face-badge" id="hud-selected-face">None (Click any sticker)</span>
                <span style="color: var(--lab-text-muted); font-size: 0.82rem;" id="hud-cubie-type"></span>
              </div>
              <div id="hud-actions-group" style="display: none;">
                <button class="btn-icon-subtle" id="hud-turn-cw">Turn 90° CW</button>
                <button class="btn-icon-subtle" id="hud-turn-ccw">Turn 90° CCW</button>
              </div>
            </div>
          </div>

          <!-- History Bar below 3D Cube -->
          <div class="history-strip-panel">
            <div class="history-strip-header">
              <div class="history-strip-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Move History & State Timeline
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-icon-subtle" id="btn-undo-move" ${sessionManager.canUndo() ? '' : 'disabled'}>
                  &larr; Undo
                </button>
                <button class="btn-icon-subtle" id="btn-redo-move" ${sessionManager.canRedo() ? '' : 'disabled'}>
                  Redo &rarr;
                </button>
              </div>
            </div>

            <div class="history-scroll-rail" id="history-chip-container">
              <span style="color: var(--lab-text-muted); font-size: 0.85rem; padding: 0.5rem;">
                No moves executed in this session yet. Click any move button or select a face to start!
              </span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: CONTROLS & GROUP THEORY TELEMETRY -->
        <div class="lab-sidebar-column">
          <!-- Latest Move Panel -->
          <div class="control-card-panel">
            <h3 class="panel-header-title">Latest Move Telemetry</h3>
            <p class="panel-header-desc">Real-time breakdown of the most recent transformation</p>

            <div class="latest-move-telemetry">
              <div class="telemetry-cell">
                <span class="telemetry-cell-label">Latest Move</span>
                <span class="telemetry-cell-val" id="telemetry-move">-</span>
              </div>
              <div class="telemetry-cell">
                <span class="telemetry-cell-label">Face</span>
                <span class="telemetry-cell-val" id="telemetry-face">-</span>
              </div>
              <div class="telemetry-cell">
                <span class="telemetry-cell-label">Direction</span>
                <span class="telemetry-cell-val" id="telemetry-dir">-</span>
              </div>
              <div class="telemetry-cell">
                <span class="telemetry-cell-label">Move #</span>
                <span class="telemetry-cell-val" id="telemetry-num">0</span>
              </div>
            </div>

            <!-- Session & Solve Controls -->
            <div class="session-bar-actions" style="margin-bottom: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn-action-primary" id="btn-session-toggle" style="flex: 1;">
                ${sessionManager.hasActiveSession() ? 'End Session' : 'Start Session'}
              </button>
              <button class="btn-action-primary" id="btn-manual-solve" style="flex: 1.2; background: var(--lab-success); color: #064E3B; border: 1px solid var(--lab-success);" ${logicalCube.isSolved() ? 'disabled' : ''}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -2px; margin-right: 4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Solve Cube
              </button>
            </div>

            <!-- Solution Result Panel for Manual Cube Lab -->
            <div id="manual-solution-panel" class="scramble-banner" style="display: none; border-color: var(--lab-success); margin-bottom: 1.25rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="scramble-title-label" style="color: var(--lab-success); font-weight: 700; margin-bottom: 0;">Solution Result</span>
                  <span id="manual-solution-count-badge" class="selected-face-badge" style="border-color: var(--lab-success); color: var(--lab-success); padding: 0.15rem 0.5rem; font-size: 0.75rem;">0 Moves</span>
                </div>
                <span id="manual-solution-status-badge" style="font-size: 0.8rem; font-weight: 600; color: var(--lab-accent);">Calculated</span>
              </div>
              <div class="scramble-text-display" id="manual-solution-seq-display" style="color: var(--lab-text); font-size: 0.95rem; margin-bottom: 0.5rem;">
                -
              </div>
              <div class="solution-steps-list" id="manual-solution-steps-chips" style="max-height: 100px; padding: 0.4rem; margin-top: 0.5rem;">
                <!-- Move badges rendered here -->
              </div>
            </div>

            <!-- Face Rotation Keyboard (18 standard moves) -->
            <h4 style="font-size: 0.92rem; font-weight: 700; color: #FFF; margin-bottom: 0.75rem;">
              Face Rotation Generators (Standard Move Notation)
            </h4>

            <div class="face-controls-grid">
              <!-- Up Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>U (Up)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="U" title="Up clockwise (90°)">U</button>
                  <button class="btn-move" data-move="U'" title="Up counterclockwise (-90°)">U′</button>
                  <button class="btn-move" data-move="U2" title="Up half-turn (180°)">U2</button>
                </div>
              </div>

              <!-- Down Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>D (Down)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="D" title="Down clockwise (90°)">D</button>
                  <button class="btn-move" data-move="D'" title="Down counterclockwise (-90°)">D′</button>
                  <button class="btn-move" data-move="D2" title="Down half-turn (180°)">D2</button>
                </div>
              </div>

              <!-- Front Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>F (Front)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="F" title="Front clockwise (90°)">F</button>
                  <button class="btn-move" data-move="F'" title="Front counterclockwise (-90°)">F′</button>
                  <button class="btn-move" data-move="F2" title="Front half-turn (180°)">F2</button>
                </div>
              </div>

              <!-- Back Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>B (Back)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="B" title="Back clockwise (90°)">B</button>
                  <button class="btn-move" data-move="B'" title="Back counterclockwise (-90°)">B′</button>
                  <button class="btn-move" data-move="B2" title="Back half-turn (180°)">B2</button>
                </div>
              </div>

              <!-- Left Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>L (Left)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="L" title="Left clockwise (90°)">L</button>
                  <button class="btn-move" data-move="L'" title="Left counterclockwise (-90°)">L′</button>
                  <button class="btn-move" data-move="L2" title="Left half-turn (180°)">L2</button>
                </div>
              </div>

              <!-- Right Face -->
              <div class="face-move-cluster">
                <div class="face-cluster-header"><span>R (Right)</span></div>
                <div class="face-btn-row">
                  <button class="btn-move" data-move="R" title="Right clockwise (90°)">R</button>
                  <button class="btn-move" data-move="R'" title="Right counterclockwise (-90°)">R′</button>
                  <button class="btn-move" data-move="R2" title="Right half-turn (180°)">R2</button>
                </div>
              </div>
            </div>

            <!-- Group Theory Permutation Decomposition Panel -->
            <div class="math-analyzer-box">
              <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--lab-accent); margin-bottom: 0.75rem;">
                Group Theory Permutation Decomposition (Section 3.6 & 5.2)
              </h4>

              <div class="analyzer-row">
                <span class="analyzer-label">Corner Cycles:</span>
                <span class="analyzer-val" id="math-corner-cycles">e (Identity)</span>
              </div>
              <div class="analyzer-row">
                <span class="analyzer-label">Disjoint Corner Slots:</span>
                <span class="analyzer-val" id="math-corner-slots">e</span>
              </div>
              <div class="analyzer-row">
                <span class="analyzer-label">Edge Cycles:</span>
                <span class="analyzer-val" id="math-edge-cycles">e (Identity)</span>
              </div>
              <div class="analyzer-row">
                <span class="analyzer-label">Disjoint Edge Slots:</span>
                <span class="analyzer-val" id="math-edge-slots">e</span>
              </div>
              <div class="analyzer-row">
                <span class="analyzer-label">Parity (Corners, Edges):</span>
                <span class="analyzer-val" id="math-parity">even, even</span>
              </div>
              <div class="analyzer-row">
                <span class="analyzer-label">Element Order: lcm(cycles):</span>
                <span class="analyzer-val" id="math-element-order" style="color: var(--lab-accent);">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mount Three.js 3D Cube Canvas
  const mountPoint = container.querySelector('#cube-3d-viewport');
  if (cubeEngine && cubeEngine.container !== mountPoint) {
    mountPoint.appendChild(cubeEngine.renderer.domElement);
    cubeEngine.container = mountPoint;
    cubeEngine.onResize();
  }

  // Bind Move Buttons
  container.querySelectorAll('.btn-move').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearManualSolution();
      const move = btn.getAttribute('data-move');
      onExecuteMove(move);
    });
  });

  container.querySelector('#btn-reset-view')?.addEventListener('click', () => onResetView());
  container.querySelector('#btn-reset-cube')?.addEventListener('click', () => { clearManualSolution(); onResetCube(); });
  container.querySelector('#btn-undo-move')?.addEventListener('click', () => { clearManualSolution(); onUndo(); });
  container.querySelector('#btn-redo-move')?.addEventListener('click', () => { clearManualSolution(); onRedo(); });

  // Manual Solution Panel Elements
  const manualSolveBtn = container.querySelector('#btn-manual-solve');
  const manualSolutionPanel = container.querySelector('#manual-solution-panel');
  const manualSolutionSeqDisplay = container.querySelector('#manual-solution-seq-display');
  const manualSolutionCountBadge = container.querySelector('#manual-solution-count-badge');
  const manualSolutionStatusBadge = container.querySelector('#manual-solution-status-badge');
  const manualSolutionStepsChips = container.querySelector('#manual-solution-steps-chips');

  let activeManualSolution = [];
  let manualSolutionStepIndex = 0;

  function renderManualSolutionBadges() {
    if (!manualSolutionStepsChips) return;
    manualSolutionStepsChips.innerHTML = activeManualSolution.map((move, i) => {
      const isCur = i === manualSolutionStepIndex;
      const isDone = i < manualSolutionStepIndex;
      return formatMoveHTML(move, { isCurrent: isCur, isDone });
    }).join('');
  }

  function clearManualSolution() {
    if (manualSolutionPanel) manualSolutionPanel.style.display = 'none';
    activeManualSolution = [];
    manualSolutionStepIndex = 0;
  }

  manualSolveBtn?.addEventListener('click', async () => {
    if (logicalCube.isSolved()) {
      alert('The cube is already solved in the identity state e!');
      return;
    }
    if (cubeEngine.isAnimating) return;

    manualSolveBtn.disabled = true;
    manualSolutionPanel.style.display = 'block';
    manualSolutionStatusBadge.textContent = 'Calculating...';
    manualSolutionStatusBadge.style.color = 'var(--lab-accent)';
    manualSolutionSeqDisplay.textContent = 'Computing optimal solution sequence...';
    manualSolutionCountBadge.textContent = 'Solving...';
    manualSolutionStepsChips.innerHTML = '';

    if (typeof onSolveCube === 'function') {
      await onSolveCube({
        onSolutionReady: (moves) => {
          activeManualSolution = moves;
          manualSolutionStepIndex = 0;
          manualSolutionCountBadge.textContent = `${moves.length} Moves`;
          manualSolutionSeqDisplay.textContent = moves.join(' ');
          manualSolutionStatusBadge.textContent = 'Executing Solution...';
          manualSolutionStatusBadge.style.color = 'var(--lab-accent)';
          renderManualSolutionBadges();
        },
        onMoveStep: (stepIdx, move) => {
          manualSolutionStepIndex = stepIdx;
          renderManualSolutionBadges();
        },
        onStatus: (msg) => {
          manualSolutionStatusBadge.textContent = msg;
        },
        onFinish: (success, moves) => {
          if (success) {
            manualSolutionStepIndex = activeManualSolution.length;
            renderManualSolutionBadges();
            manualSolutionStatusBadge.textContent = '✓ Solved (State Verified)';
            manualSolutionStatusBadge.style.color = 'var(--lab-success)';
          } else {
            manualSolutionStatusBadge.textContent = 'Solve Failed';
            manualSolutionStatusBadge.style.color = 'var(--lab-error)';
          }
          manualSolveBtn.disabled = logicalCube.isSolved() || cubeEngine.isAnimating;
          updateTelemetry();
        }
      });
    }
  });

  // Session start/end
  const sessionBtn = container.querySelector('#btn-session-toggle');
  sessionBtn?.addEventListener('click', () => {
    if (sessionManager.hasActiveSession()) {
      if (confirm('End the current recording session? All moves will be preserved in your session history.')) {
        onEndSession();
        sessionBtn.textContent = 'Start Session';
      }
    } else {
      onStartSession();
      sessionBtn.textContent = 'End Session';
    }
  });

  // Sticker selection HUD controls
  let activeSelectedFace = null;
  cubeEngine.options.onStickerSelected = (selection) => {
    const faceEl = container.querySelector('#hud-selected-face');
    const typeEl = container.querySelector('#hud-cubie-type');
    const actionsGroup = container.querySelector('#hud-actions-group');
    if (!faceEl || !typeEl || !actionsGroup) return;

    if (selection) {
      activeSelectedFace = selection.currentFace;
      faceEl.textContent = `${selection.faceName}`;
      faceEl.style.borderColor = 'var(--lab-accent)';
      typeEl.textContent = `(${selection.cubieType} Piece)`;
      actionsGroup.style.display = 'flex';
    } else {
      activeSelectedFace = null;
      faceEl.textContent = 'None (Click any sticker)';
      faceEl.style.borderColor = 'var(--lab-border)';
      typeEl.textContent = '';
      actionsGroup.style.display = 'none';
    }
  };

  container.querySelector('#hud-turn-cw')?.addEventListener('click', () => {
    if (activeSelectedFace) {
      onExecuteMove(activeSelectedFace);
    }
  });

  container.querySelector('#hud-turn-ccw')?.addEventListener('click', () => {
    if (activeSelectedFace) {
      onExecuteMove(activeSelectedFace + "'");
    }
  });

  // Helper to refresh UI telemetry & group theory panel
  function updateTelemetry() {
    if (!container || !container.querySelector('#math-corner-cycles')) return;
    const latest = sessionManager.getLatestMove();
    const moveEl = container.querySelector('#telemetry-move');
    const faceEl = container.querySelector('#telemetry-face');
    const dirEl = container.querySelector('#telemetry-dir');
    const numEl = container.querySelector('#telemetry-num');

    if (latest && MOVE_DIRECTIONS[latest.move]) {
      const info = MOVE_DIRECTIONS[latest.move];
      moveEl.innerHTML = formatMoveHTML(latest.move, { extraClass: 'telemetry-move-pill' });
      faceEl.textContent = info.face;
      dirEl.textContent = info.direction;
      numEl.textContent = latest.index;
    } else {
      moveEl.textContent = '-';
      faceEl.textContent = '-';
      dirEl.textContent = '-';
      numEl.textContent = '0';
    }

    // Status dot
    const statusDot = container.querySelector('#cube-status-dot');
    const statusLabel = container.querySelector('#cube-status-label');
    const solved = logicalCube.isSolved();
    statusDot.className = `status-indicator ${solved ? '' : 'unsolved'}`;
    statusLabel.textContent = solved ? 'Cube State: Solved (Identity e)' : 'Cube State: Permuted';

    // Solve Cube button state
    if (manualSolveBtn) {
      manualSolveBtn.disabled = solved || cubeEngine.isAnimating;
    }

    // Undo/Redo button states
    const undoBtn = container.querySelector('#btn-undo-move');
    const redoBtn = container.querySelector('#btn-redo-move');
    if (undoBtn) undoBtn.disabled = !sessionManager.canUndo();
    if (redoBtn) redoBtn.disabled = !sessionManager.canRedo();

    // Group theory analysis
    const analysis = extractPermutationCycles(logicalCube);
    container.querySelector('#math-corner-cycles').textContent = analysis.cornerCycleStr;
    container.querySelector('#math-corner-slots').textContent = analysis.cornerNotation;
    container.querySelector('#math-edge-cycles').textContent = analysis.edgeCycleStr;
    container.querySelector('#math-edge-slots').textContent = analysis.edgeNotation;
    container.querySelector('#math-parity').textContent = `${analysis.cornerParity}, ${analysis.edgeParity}`;
    container.querySelector('#math-element-order').textContent = `${analysis.totalOrder}`;

    // Render History Rail in place without triggering window/document scrolling
    const historyContainer = container.querySelector('#history-chip-container');
    const history = sessionManager.getHistory();
    const ptr = sessionManager.historyPointer;

    if (history.length === 0) {
      historyContainer.innerHTML = `
        <span style="color: var(--lab-text-muted); font-size: 0.85rem; padding: 0.5rem;">
          No moves executed in this session yet. Click any move button or select a face to start!
        </span>
      `;
    } else {
      historyContainer.innerHTML = history.map((item, idx) => `
        <div class="history-chip ${idx === ptr ? 'active-pointer' : ''}" data-idx="${idx}" title="State after move #${item.index}: ${item.move}">
          <span class="history-chip-idx">#${item.index}</span>
          ${formatMoveHTML(item.move)}
        </div>
      `).join('');

      historyContainer.querySelectorAll('.history-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const idx = parseInt(chip.getAttribute('data-idx'), 10);
          onSelectHistory(idx);
        });
      });

      // Scroll the history container horizontally ONLY (prevent window page scroll)
      const activeChip = historyContainer.querySelector('.active-pointer');
      if (activeChip) {
        const chipLeft = activeChip.offsetLeft;
        const chipWidth = activeChip.offsetWidth;
        const containerWidth = historyContainer.clientWidth;
        historyContainer.scrollLeft = chipLeft - (containerWidth / 2) + (chipWidth / 2);
      }
    }
  }

  // Register session change callback
  sessionManager.options.onHistoryChanged = () => {
    updateTelemetry();
  };

  updateTelemetry();

  return () => {
    sessionManager.options.onHistoryChanged = null;
    cubeEngine.options.onStickerSelected = null;
  };
}
