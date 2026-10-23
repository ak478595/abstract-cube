import Cube from './src/core/cube-lib.js';

// Equator insertions for U-layer working space:
const MIDDLE_INSERTIONS = [
  // Slot 9 (FL):
  { targetSlot: 9, setupSlot: 1, alg: "U' L' U L U F U' F'" },
  { targetSlot: 9, setupSlot: 2, alg: "U F U' F' U' L' U L" },
  // Slot 10 (BL):
  { targetSlot: 10, setupSlot: 3, alg: "U L U' L' U' B' U B" },
  { targetSlot: 10, setupSlot: 2, alg: "U' B' U B U L U' L'" }
];

const KICK_ALGS = {
  8: "U R U' R' U' F' U F",
  9: "U' L' U L U F U' F'",
  10: "U L U' L' U' B' U B",
  11: "U' R' U R U B U' B'"
};

function insertEquatorEdge(cube, pieceId) {
  let moves = [];
  let cur = cube.clone();

  let curSlot = cur.ep.indexOf(pieceId);
  if (curSlot === pieceId && cur.eo[curSlot] === 0) return { success: true, moves: [] };

  // If trapped in middle layer:
  if ([8, 9, 10, 11].includes(curSlot)) {
    const kick = KICK_ALGS[curSlot];
    cur.move(kick);
    moves.push(kick);
    curSlot = cur.ep.indexOf(pieceId);
  }

  // Now piece must be in U layer (0=UR, 1=UF, 2=UL, 3=UB)
  const candidates = MIDDLE_INSERTIONS.filter(ins => ins.targetSlot === pieceId);
  const uTurns = ['', 'U', 'U2', "U'"];

  for (const cand of candidates) {
    for (const u of uTurns) {
      const test = cur.clone();
      if (u) test.move(u);
      test.move(cand.alg);
      if (test.ep[pieceId] === pieceId && test.eo[pieceId] === 0) {
        const seq = [u, cand.alg].filter(Boolean).join(' ');
        cur.move(seq);
        moves.push(seq);
        return { success: true, moves, cube: cur };
      }
    }
  }

  return { success: false, reason: 'Failed equator insertion' };
}

const scramble = "U' F' B' L R L' R B' U B L2 D F' D U' R2 D B' U2 L";
const c = new Cube().move(scramble);

// Let's test insertEquatorEdge on trial 3:
console.log('Testing insertEquatorEdge...');
const res = insertEquatorEdge(c, 10);
console.log('Result:', res.success, res.moves);
