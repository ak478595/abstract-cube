/**
 * CubeLab Application Orchestrator
 */

import { LogicalCube } from './core/LogicalCube.js';
import { CubeEngine3D } from './core/CubeEngine3D.js';
import { SessionManager } from './core/SessionManager.js';
import { renderHomepage } from './ui/Homepage.js';
import { renderManualLabView } from './ui/ManualLabView.js';
import { renderAutomaticSolverView } from './ui/AutomaticSolverView.js';
import { LabBackground } from './ui/LabBackground.js';

class CubeLabApp {
  constructor() {
    this.currentView = 'home';
    this.viewport = document.getElementById('app-viewport');
    this.stageCache = document.getElementById('hidden-stage-cache');

    // 1. Authoritative Logical State
    this.logicalCube = new LogicalCube();

    // 2. Pre-initialize Solver in background
    LogicalCube.ensureSolver().then(() => {
      console.log('CubeLab: Kociemba solver tables precomputed and ready.');
    });

    // 3. 3D Cube Engine
    this.cubeEngine = new CubeEngine3D(this.stageCache, {
      cubieSize: 0.96, // Reduced black gaps between cubies
      animationSpeed: 230
    });

    // 4. Unified Session Manager
    this.sessionManager = new SessionManager(this.logicalCube);

    // Background FX instance
    this.bgEffect = null;

    this.initNavigation();
    this.navigateTo('home');
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

  navigateTo(viewName) {
    if (viewName === 'about') {
      this.navigateTo('home');
      setTimeout(() => {
        document.querySelector('.site-footer')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (viewName === 'algebra') {
      this.navigateTo('home');
      setTimeout(() => {
        document.getElementById('section-algebra')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    this.currentView = viewName;

    // Update active nav button
    document.querySelectorAll('.nav-link-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-target') === viewName);
    });

    // Toggle body dark mode class
    if (viewName === 'lab' || viewName === 'solver') {
      document.body.classList.add('dark-mode-active');
    } else {
      document.body.classList.remove('dark-mode-active');
    }

    // Clean up previous canvas background
    if (this.bgEffect) {
      this.bgEffect.destroy();
      this.bgEffect = null;
    }

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
        onSelectHistory: (idx) => this.travelToHistoryState(idx)
      });
      this.bgEffect = new LabBackground('lab-bg-canvas');
    } else if (viewName === 'solver') {
      renderAutomaticSolverView(this.viewport, {
        cubeEngine: this.cubeEngine,
        logicalCube: this.logicalCube,
        sessionManager: this.sessionManager,
        onExecuteMove: (move) => this.executeManualMove(move),
        onResetView: () => this.cubeEngine.resetView()
      });
      this.bgEffect = new LabBackground('lab-bg-canvas');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async executeManualMove(moveStr) {
    if (!moveStr || this.cubeEngine.isAnimating) return;
    this.sessionManager.recordMove(moveStr);
    await this.cubeEngine.executeMove(moveStr);
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
