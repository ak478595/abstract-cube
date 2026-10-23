/**
 * Cube Simulator Application Orchestrator
 */

import { LogicalCube } from './core/LogicalCube.js';
import { CubeEngine3D } from './core/CubeEngine3D.js';
import { SessionManager } from './core/SessionManager.js';
import { renderHomepage } from './ui/Homepage.js';
import { renderManualLabView } from './ui/ManualLabView.js';
import { renderAutomaticSolverView } from './ui/AutomaticSolverView.js';
import { CubesBackground } from './ui/CubesBackground.js';
import { WelcomeScreen } from './ui/WelcomeScreen.js';

class CubeLabApp {
  constructor() {
    this.currentView = 'home';
    this.viewport = document.getElementById('app-viewport');
    this.stageCache = document.getElementById('hidden-stage-cache');
    this.cubesBgLayer = document.getElementById('cubes-bg-layer');

    // 1. Authoritative Logical State
    this.logicalCube = new LogicalCube();

    // 2. Pre-initialize Solver in background
    LogicalCube.ensureSolver().then(() => {
      console.log('Cube Simulator: Kociemba solver tables precomputed and ready.');
    });

    // 3. 3D Cube Engine
    this.cubeEngine = new CubeEngine3D(this.stageCache, {
      cubieSize: 0.96, // Reduced black gaps between cubies
      animationSpeed: 230
    });

    // 4. Unified Session Manager
    this.sessionManager = new SessionManager(this.logicalCube);

    // 5. Cubes WebGL 2 Animated Background Instance
    this.cubesBg = null;

    // 6. Navigation
    this.initNavigation();

    // 7. Render initial home page view
    this.navigateTo('home');

    // 8. Launch Welcome Screen once on initial load (support URL param ?welcome=1 for testing)
    this.initWelcomeScreen();
  }

  initWelcomeScreen() {
    // Show welcome screen on every fresh page load.
    // The welcome plays once per page load — navigating back to home does NOT
    // replay it because initWelcomeScreen is only called from the constructor.
    const welcome = new WelcomeScreen(() => {
      // Callback after welcome screen finishes fading out
    });
    welcome.show();
  }

  initNavigation() {
    document.querySelectorAll('.nav-link-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        this.navigateTo(target);
      });
    });

    document.getElementById('nav-logo')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateTo('home');
    });
  }

  updateCubesBackground(viewName) {
    const isHome = viewName === 'home';

    if (isHome) {
      // Home page must NOT show the animated cube background
      if (this.cubesBgLayer) {
        this.cubesBgLayer.classList.remove('active');
      }
      if (this.cubesBg) {
        this.cubesBg.destroy();
        this.cubesBg = null;
      }
    } else {
      // All other views (lab, solver) must show the background
      if (this.cubesBgLayer) {
        this.cubesBgLayer.classList.add('active');
        if (!this.cubesBg) {
          this.cubesBg = new CubesBackground(this.cubesBgLayer, {
            gridSize: 10,
            faceColor: '#F8FAFC', // Classroom crisp light background
            edgeColor: '#CBD5E1', // High-contrast subtle slate grid borders
            maxAngle: 45,
            radius: 3,
            rippleColor: '#174EA6', // Deep blue ripple
            gap: 0.18,
            edgeStyle: 'solid',
            edgeWidth: 1,
            faceOpacity: 0.88,
            shading: 0.3,
            perspective: 0,
            speed: 1,
            bounce: 0.4,
            brush: 1,
            rippleSpeed: 1,
            autoAnimate: true,
            rippleOnClick: true,
            intro: true
          });
        } else {
          this.cubesBg.wake();
        }
      }
    }
  }

  scrollToSection(sectionId) {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 70;
    const el = document.getElementById(sectionId);
    if (!el) return;

    const elPos = el.getBoundingClientRect().top + window.pageYOffset;
    const offsetPos = Math.max(0, elPos - headerHeight - 16);

    window.scrollTo({
      top: offsetPos,
      behavior: 'smooth'
    });
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update active nav button
    document.querySelectorAll('.nav-link-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-target') === viewName);
    });

    // Classroom Projector Light Theme: Do NOT add dark-mode-active to body
    document.body.classList.remove('dark-mode-active');

    // Update Cubes Animated Background state
    this.updateCubesBackground(viewName);

    // Detach Three.js canvas safely to stage cache before wiping DOM
    if (this.cubeEngine.renderer && this.cubeEngine.renderer.domElement.parentElement) {
      this.stageCache.appendChild(this.cubeEngine.renderer.domElement);
    }

    if (viewName === 'home') {
      renderHomepage(this.viewport, {
        onNavigate: (target) => this.navigateTo(target),
        onRunExperiment: (alg) => this.runExperimentInLab(alg)
      });
    } else if (viewName === 'lab') {
      renderManualLabView(this.viewport, {
        cubeEngine: this.cubeEngine,
        logicalCube: this.logicalCube,
        sessionManager: this.sessionManager,
        onExecuteMove: (move) => this.executeManualMove(move),
        onUndo: () => this.handleUndo(),
        onRedo: () => this.handleRedo(),
        onResetCube: () => this.handleResetCube(),
        onResetView: () => this.cubeEngine.resetView(),
        onStartSession: () => this.sessionManager.startSession('manual'),
        onEndSession: () => this.sessionManager.endSession(),
        onSelectHistory: (idx) => this.travelToHistoryState(idx),
        onSolveCube: (callbacks) => this.handleManualSolve(callbacks)
      });
    } else if (viewName === 'solver') {
      renderAutomaticSolverView(this.viewport, {
        cubeEngine: this.cubeEngine,
        logicalCube: this.logicalCube,
        sessionManager: this.sessionManager,
        onExecuteMove: (move) => this.executeManualMove(move),
        onResetView: () => this.cubeEngine.resetView()
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async executeManualMove(moveStr) {
    if (!moveStr || this.cubeEngine.isAnimating) return;
    this.sessionManager.recordMove(moveStr);
    await this.cubeEngine.executeMove(moveStr);
  }

  async handleManualSolve({ onSolutionReady, onMoveStep, onStatus, onFinish }) {
    if (this.logicalCube.isSolved() || this.cubeEngine.isAnimating) return;

    if (onStatus) onStatus('Computing solution with Cube Solver...');
    await LogicalCube.ensureSolver();

    const solutionStr = this.logicalCube.solve();
    if (!solutionStr) {
      if (onStatus) onStatus('Failed: Solver was unable to compute a solution.');
      if (onFinish) onFinish(false, null);
      return;
    }

    const moves = solutionStr.trim().split(/\s+/).filter(Boolean);
    if (onSolutionReady) onSolutionReady(moves);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (onMoveStep) onMoveStep(i, move);
      if (onStatus) onStatus(`Executing move ${i + 1} of ${moves.length}: ${move}`);
      this.sessionManager.recordMove(move);
      await this.cubeEngine.executeMove(move);
    }

    if (onFinish) onFinish(true, moves);
  }

  async handleUndo() {
    if (!this.sessionManager.canUndo() || this.cubeEngine.isAnimating) return;
    const undone = this.sessionManager.undo();
    if (undone) {
      // Invert move visually
      const move = undone.move;
      const inv = move.includes("'") ? move.replace("'", "") : move.includes('2') ? move : move + "'";
      this.logicalCube.applyMove(inv); // undo logical state
      await this.cubeEngine.executeMove(inv);
    }
  }

  async handleRedo() {
    if (!this.sessionManager.canRedo() || this.cubeEngine.isAnimating) return;
    const redone = this.sessionManager.redo();
    if (redone) {
      this.logicalCube.applyMove(redone.move);
      await this.cubeEngine.executeMove(redone.move);
    }
  }

  handleResetCube() {
    this.logicalCube.reset();
    this.cubeEngine.resetToIdentity();
    this.sessionManager.startSession(this.currentView === 'solver' ? 'auto' : 'manual');
  }

  async travelToHistoryState(targetIndex) {
    if (this.cubeEngine.isAnimating) return;
    const currentPtr = this.sessionManager.historyPointer;
    if (targetIndex === currentPtr) return;

    if (targetIndex < currentPtr) {
      // Step backward
      while (this.sessionManager.historyPointer > targetIndex) {
        await this.handleUndo();
      }
    } else {
      // Step forward
      while (this.sessionManager.historyPointer < targetIndex) {
        await this.handleRedo();
      }
    }
  }

  async runExperimentInLab(algStr) {
    this.navigateTo('lab');
    setTimeout(async () => {
      this.handleResetCube();
      const moves = algStr.trim().split(/\s+/).filter(Boolean);
      for (const m of moves) {
        await this.executeManualMove(m);
      }
    }, 200);
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new CubeLabApp();
});
