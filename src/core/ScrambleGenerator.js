/**
 * ScrambleGenerator
 * Generates official standard Rubik's cube scrambles.
 * Avoids consecutive moves on the same face.
 */

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

export function generateScramble(length = 20) {
  const moves = [];
  let lastFace = null;
  let secondLastFace = null;

  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];

    // Don't turn same face consecutively
    if (face === lastFace) continue;

    // Avoid opposite faces oscillating (e.g. U D U)
    const isOpposite = (f1, f2) => {
      return (f1 === 'U' && f2 === 'D') || (f1 === 'D' && f2 === 'U') ||
             (f1 === 'L' && f2 === 'R') || (f1 === 'R' && f2 === 'L') ||
             (f1 === 'F' && f2 === 'B') || (f1 === 'B' && f2 === 'F');
    };

    if (face === secondLastFace && isOpposite(face, lastFace)) continue;

    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    moves.push(face + mod);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}
