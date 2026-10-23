import Cube from './src/core/cube-lib.js';
import { CFOPSolver, solveCrossLookahead, solveF2L, solveOLL, solvePLL, isCrossSolved, isF2LSolved, isOLLSolved } from './src/core/CFOPSolver.js';

console.log('Testing 50 random cubes with detailed logging...');

let failures = 0;
for (let i = 0; i < 50; i++) {
  const c = Cube.random();
  const t0 = Date.now();
  const res = CFOPSolver.solve(c);
  const elapsed = Date.now() - t0;
  console.log(`Cube ${i}: success=${res.success}, moves=${res.moves?.length}, time=${elapsed}ms`);
  if (!res.success || !res.verified) {
    failures++;
    console.log(`FAILED on cube ${i}!`);
    console.log('Status:', res.status, 'Limitations:', res.limitations);
    
    // Check stages
    const cross = solveCrossLookahead(c);
    console.log('Cross:', cross.success, 'isCrossSolved:', isCrossSolved(cross.cube));
    if (cross.success) {
      const f2l = solveF2L(cross.cube);
      console.log('F2L:', f2l.success, 'isF2LSolved:', isF2LSolved(f2l.cube));
      if (f2l.success) {
        const oll = solveOLL(f2l.cube);
        console.log('OLL:', oll.success, 'isOLLSolved:', isOLLSolved(oll.cube));
        if (oll.success) {
          const pll = solvePLL(oll.cube);
          console.log('PLL:', pll.success, 'isSolved:', pll.cube?.isSolved());
        }
      }
    }
    break;
  }
}
