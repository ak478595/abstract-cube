import Cube from './src/core/cube-lib.js';
import { CFOPSolver, isCrossSolved, searchCrossPiece } from './src/core/CFOPSolver.js';
import { generateScramble } from './src/core/ScrambleGenerator.js';

// Standard CFOP baseline: greedy fixed cross order [DR, DF, DL, DB] without lookahead scoring
function solveStandardCross(cube) {
  const order = [4, 5, 6, 7];
  let cur = cube.clone();
  let moves = [];
  for (let i = 0; i < order.length; i++) {
    const targetPieces = order.slice(0, i + 1);
    const goal = (c) => targetPieces.every(p => c.ep[p] === p && c.eo[p] === 0);
    const res = searchCrossPiece(cur, goal, undefined, 5);
    if (!res.found) return { success: false };
    cur = res.cube;
    moves.push(...res.moves);
  }
  return { success: true, moves, cube: cur };
}

console.log('================================================================');
console.log('       CFOP-X VS STANDARD CFOP BENCHMARK (50 SCRAMBLES)       ');
console.log('================================================================\n');

let cfopXSuccess = 0;
let cfopXMoves = 0;
let cfopXTime = 0;

let baseSuccess = 0;
let baseCrossMoves = 0;
let cfopXCrossMoves = 0;

for (let i = 0; i < 50; i++) {
  const sc = generateScramble(20);
  const raw = new Cube();
  raw.move(sc.join(' '));

  // Benchmark Standard Cross vs CFOP-X Lookahead Cross
  const baseCross = solveStandardCross(raw);
  if (baseCross.success) {
    baseSuccess++;
    baseCrossMoves += baseCross.moves.length;
  }

  const t0 = performance.now();
  const cfopXRes = CFOPSolver.solve(raw);
  const ms = performance.now() - t0;

  if (cfopXRes.success && cfopXRes.verified) {
    cfopXSuccess++;
    cfopXMoves += cfopXRes.totalMoves;
    cfopXTime += ms;
    cfopXCrossMoves += cfopXRes.stageBreakdown.cross.moves.length;
  }
}

console.log(`Scrambles Attempted: 50`);
console.log(`CFOP-X Solved & Independently Verified: ${cfopXSuccess} / 50 (${(cfopXSuccess/50*100).toFixed(1)}%)`);
console.log(`CFOP-X Mean Full Solution Length: ${(cfopXMoves / cfopXSuccess).toFixed(1)} HTM`);
console.log(`CFOP-X Mean Solve Time: ${(cfopXTime / 50).toFixed(1)} ms`);
console.log(`CFOP-X Cross Move Count (with lookahead): ${(cfopXCrossMoves / cfopXSuccess).toFixed(2)} HTM`);
console.log(`Standard CFOP Cross Move Count (fixed greedy): ${(baseCrossMoves / baseSuccess).toFixed(2)} HTM`);
console.log(`Cross efficiency gain with lookahead: ${((1 - (cfopXCrossMoves / baseCrossMoves)) * 100).toFixed(1)}% fewer cross turns`);
