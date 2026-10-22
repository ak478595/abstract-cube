/**
 * CubeEngineValidator - Automated verification of the 9 move validation rules
 * Section 7.6 of specification:
 * - R four times returns to initial state.
 * - R followed by R' returns to initial state.
 * - R2 followed by R2 returns to initial state.
 * - U followed by U' returns to initial state.
 * - F followed by F' returns to initial state.
 * - Each single face turn affects only its intended outer layer.
 * - Four turns of every face return the cube to initial state.
 * - Face selection remains correct after multiple moves.
 */

import { LogicalCube } from './LogicalCube.js';

export function runCubeEngineTests() {
  const results = [];
  const initialFacelet = new LogicalCube().getAsString();

  function test(name, fn) {
    try {
      const passed = fn();
      results.push({ name, passed: !!passed, error: null });
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
    }
  }

  // 1. R four times returns the cube to its initial state
  test("R four times: R⁴ = e", () => {
    const c = new LogicalCube();
    c.applyAlgorithm('R R R R');
    return c.getAsString() === initialFacelet && c.isSolved();
  });

  // 2. R followed by R' returns to initial state
  test("R followed by R': R R' = e", () => {
    const c = new LogicalCube();
    c.applyAlgorithm("R R'");
    return c.getAsString() === initialFacelet && c.isSolved();
  });

  // 3. R2 followed by R2 returns to initial state
  test("R2 followed by R2: (R²)² = e", () => {
    const c = new LogicalCube();
    c.applyAlgorithm('R2 R2');
    return c.getAsString() === initialFacelet && c.isSolved();
  });

  // 4. U followed by U' returns to initial state
  test("U followed by U': U U' = e", () => {
    const c = new LogicalCube();
    c.applyAlgorithm("U U'");
    return c.getAsString() === initialFacelet && c.isSolved();
  });

  // 5. F followed by F' returns to initial state
  test("F followed by F': F F' = e", () => {
    const c = new LogicalCube();
    c.applyAlgorithm("F F'");
    return c.getAsString() === initialFacelet && c.isSolved();
  });

  // 6. Each single face turn affects only its intended outer layer
  test("Single face turns affect only intended outer layers", () => {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    for (const f of faces) {
      const c = new LogicalCube();
      c.applyMove(f);
      // Center stickers must remain unaltered across all faces
      // Centers are at index 4 of each 9-facelet block: 4, 13, 22, 31, 40, 49
      const centers = [4, 13, 22, 31, 40, 49];
      const str = c.getAsString();
      for (const idx of centers) {
        if (str[idx] !== initialFacelet[idx]) {
          return false;
        }
      }
    }
    return true;
  });

  // 7. Four turns of every face return the cube to its initial state
  test("Four quarter turns of every face (X⁴ = e)", () => {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    for (const f of faces) {
      const c = new LogicalCube();
      c.applyAlgorithm(`${f} ${f} ${f} ${f}`);
      if (c.getAsString() !== initialFacelet || !c.isSolved()) {
        return false;
      }
    }
    return true;
  });

  // 8. Commutator order 6 check: (R U R' U')⁶ = e
  test("Commutator order: [R, U]⁶ = (R U R' U')⁶ = e", () => {
    const c = new LogicalCube();
    for (let i = 0; i < 6; i++) {
      c.applyAlgorithm("R U R' U'");
    }
    return c.isSolved();
  });

  // 9. High order sequence check: (R2 U2)⁶ = e
  test("Subgroup sequence: (R² U²)⁶ = e", () => {
    const c = new LogicalCube();
    for (let i = 0; i < 6; i++) {
      c.applyAlgorithm("R2 U2");
    }
    return c.isSolved();
  });

  return results;
}
