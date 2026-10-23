import Cube from './cube-lib.js';
import { FACE_OFFSETS } from './constants.js';
import { solveLayerByLayer } from './LayerByLayerSolver.js';
import { CFOPSolver } from './CFOPSolver.js';

let isSolverReady = false;
let solverPromise = null;
let solverInitDurationMs = null;

export class LogicalCube {
  constructor() {
    this.cube = new Cube();
  }

  static async ensureSolver() {
    if (isSolverReady) return true;
    if (solverPromise) return solverPromise;

    solverPromise = new Promise((resolve) => {
      // Cube.initSolver() takes ~1-3s in browser / node
      setTimeout(() => {
        try {
          const t0 = performance.now();
          Cube.initSolver();
          solverInitDurationMs = performance.now() - t0;
          isSolverReady = true;
          resolve(true);
        } catch (e) {
          console.error('Failed to init solver:', e);
          resolve(false);
        }
      }, 10);
    });

    return solverPromise;
  }

  static isSolverInitialized() {
    return isSolverReady;
  }

  static getSolverInitDuration() {
    return solverInitDurationMs;
  }

  reset() {
    this.cube.identity();
  }

  isSolved() {
    return this.cube.isSolved();
  }

  applyMove(moveStr) {
    if (!moveStr) return;
    this.cube.move(moveStr);
  }

  applyAlgorithm(alg) {
    if (!alg) return;
    const moves = Array.isArray(alg) ? alg : alg.trim().split(/\s+/).filter(Boolean);
    for (const m of moves) {
      this.applyMove(m);
    }
  }

  getAsString() {
    return this.cube.asString();
  }

  /**
   * Get 54 facelet colors corresponding to U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
   */
  getFacelets() {
    return this.cube.asString().split('');
  }

  /**
   * Get 3x3 facelet grid for a face: 'U', 'R', 'F', 'D', 'L', 'B'
   */
  getFaceGrid(face) {
    const str = this.cube.asString();
    const offset = FACE_OFFSETS[face];
    const grid = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        row.push(str[offset + r * 3 + c]);
      }
      grid.push(row);
    }
    return grid;
  }

  solve() {
    if (!isSolverReady) {
      Cube.initSolver();
      isSolverReady = true;
    }
    if (this.isSolved()) return '';
    return this.cube.solve();
  }

  solveLBL() {
    if (this.isSolved()) return '';
    const result = solveLayerByLayer(this.cube);
    if (!result.verified) {
      throw new Error(result.error || 'Layer-by-Layer solver failed to verify solution');
    }
    return result.moveString;
  }

  solveCFOP() {
    if (this.isSolved()) return '';
    const result = CFOPSolver.solve(this.cube);
    if (!result.verified) {
      throw new Error(result.limitations || 'CFOP-X solver failed to verify solution');
    }
    return result.moveString;
  }

  clone() {
    const copy = new LogicalCube();
    copy.cube = new Cube(this.cube);
    return copy;
  }

  toJSON() {
    return this.cube.toJSON();
  }
}
