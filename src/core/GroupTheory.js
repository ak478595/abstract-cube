/**
 * Permutation and Group Theory Analyzer
 * Directly implements Section 3.6 and Section 5.2 of the VIT Abstract Algebra paper.
 */
import Cube from './cube-lib.js';
import { GENERATOR_CYCLES, CORNER_SLOTS, EDGE_SLOTS } from './constants.js';

// GCD and LCM helper
export function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export function multiLcm(arr) {
  if (!arr || arr.length === 0) return 1;
  return arr.reduce((acc, val) => lcm(acc, val), 1);
}

/**
 * Maps cubejs internal corner indexing to Paper's corner slots.
 * Cubejs corners:
 * 0: URF, 1: UFL, 2: ULB, 3: UBR, 4: DFR, 5: DLF, 6: DBL, 7: DRB
 * Notice this matches CORNER_SLOTS!
 *
 * Cubejs edges:
 * 0: UR, 1: UF, 2: UL, 3: UB, 4: DR, 5: DF, 6: DL, 7: DB, 8: FR, 9: FL, 10: BL, 11: BR
 * Matches EDGE_SLOTS!
 */
export function extractPermutationCycles(logicalCube) {
  const json = logicalCube.toJSON();
  const cp = json.cp; // Array of length 8: cp[i] = current piece index in slot i
  const co = json.co; // Array of length 8: co[i] = orientation/twist (0, 1, 2)
  const ep = json.ep; // Array of length 12: ep[i] = current edge piece in slot i
  const eo = json.eo; // Array of length 12: eo[i] = orientation/flip (0, 1)

  // Find corner cycles
  const visitedCorners = new Array(8).fill(false);
  const cornerCycles = [];

  for (let i = 0; i < 8; i++) {
    if (visitedCorners[i]) continue;
    let curr = i;
    const cycle = [];
    let netTwist = 0;

    while (!visitedCorners[curr]) {
      visitedCorners[curr] = true;
      cycle.push({
        slotIndex: curr,
        slotName: CORNER_SLOTS[curr],
        pieceOrigSlot: CORNER_SLOTS[cp[curr]],
        twist: co[curr]
      });
      netTwist = (netTwist + co[curr]) % 3;
      curr = cp[curr];
    }

    if (cycle.length > 1 || (cycle.length === 1 && cycle[0].twist !== 0)) {
      cornerCycles.push({
        pieces: cycle,
        length: cycle.length,
        netTwist: (netTwist % 3 + 3) % 3,
        // Order according to Section 3.6.7:
        // A corner cycle of length k has order k if netTwist = 0, else 3k
        order: (cycle.length === 1) ? 3 : (netTwist % 3 === 0 ? cycle.length : cycle.length * 3)
      });
    }
  }

  // Find edge cycles
  const visitedEdges = new Array(12).fill(false);
  const edgeCycles = [];

  for (let i = 0; i < 12; i++) {
    if (visitedEdges[i]) continue;
    let curr = i;
    const cycle = [];
    let netFlip = 0;

    while (!visitedEdges[curr]) {
      visitedEdges[curr] = true;
      cycle.push({
        slotIndex: curr,
        slotName: EDGE_SLOTS[curr],
        pieceOrigSlot: EDGE_SLOTS[ep[curr]],
        flip: eo[curr]
      });
      netFlip = (netFlip + eo[curr]) % 2;
      curr = ep[curr];
    }

    if (cycle.length > 1 || (cycle.length === 1 && cycle[0].flip !== 0)) {
      edgeCycles.push({
        pieces: cycle,
        length: cycle.length,
        netFlip: (netFlip % 2 + 2) % 2,
        // Order according to Section 3.6.7:
        // An edge cycle of length k has order k if netFlip is even, else 2k
        order: (cycle.length === 1) ? 2 : (netFlip % 2 === 0 ? cycle.length : cycle.length * 2)
      });
    }
  }

  // Compute total parity
  // Corner parity: sum of (length - 1) for all cycles
  let cornerSwaps = 0;
  for (const c of cornerCycles) {
    if (c.length > 1) cornerSwaps += (c.length - 1);
  }
  const cornerParity = cornerSwaps % 2 === 0 ? 'even' : 'odd';

  let edgeSwaps = 0;
  for (const e of edgeCycles) {
    if (e.length > 1) edgeSwaps += (e.length - 1);
  }
  const edgeParity = edgeSwaps % 2 === 0 ? 'even' : 'odd';

  // Overall order of the element is lcm of orders of all individual cycles
  const allOrders = [
    ...cornerCycles.map(c => c.order),
    ...edgeCycles.map(e => e.order)
  ];
  const totalOrder = allOrders.length === 0 ? 1 : multiLcm(allOrders);

  // Formatted cycle strings matching Table 3 notation: e.g. "5 (2), 1 (1)"
  const cornerCycleStr = cornerCycles.length === 0
    ? 'e (Identity)'
    : cornerCycles.map(c => `${c.length}${c.netTwist !== 0 ? ` (${c.netTwist})` : ''}`).join(', ');

  const edgeCycleStr = edgeCycles.length === 0
    ? 'e (Identity)'
    : edgeCycles.map(e => `${e.length}${e.netFlip !== 0 ? ` (${e.netFlip})` : ''}`).join(', ');

  // Standard disjoint cycle strings: e.g. (URF UBR DRB DFR)
  const cornerNotation = cornerCycles.length === 0
    ? 'e'
    : cornerCycles.map(c => `(${c.pieces.map(p => p.slotName).join(' ')})`).join(' ');

  const edgeNotation = edgeCycles.length === 0
    ? 'e'
    : edgeCycles.map(e => `(${e.pieces.map(p => p.slotName).join(' ')})`).join(' ');

  return {
    cornerCycles,
    edgeCycles,
    cornerCycleStr,
    edgeCycleStr,
    cornerNotation,
    edgeNotation,
    cornerParity,
    edgeParity,
    totalOrder,
    // Total twists and flips for verification of legality rules
    totalTwist: co.reduce((a, b) => (a + b) % 3, 0),
    totalFlip: eo.reduce((a, b) => (a + b) % 2, 0)
  };
}

/**
 * Calculates theoretical element order for any move sequence string.
 */
export function analyzeMoveSequence(moveSequenceStr) {
  const c = new Cube();
  c.move(moveSequenceStr);
  const json = c.toJSON();
  const mockLogical = {
    toJSON: () => json
  };
  return extractPermutationCycles(mockLogical);
}
