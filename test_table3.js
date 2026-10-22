import { analyzeMoveSequence } from './src/core/GroupTheory.js';
import { PAPER_TABLE_3 } from './src/core/constants.js';

console.log('--- Verifying Table 3 sequences against Paper ---');
for (const item of PAPER_TABLE_3) {
  const result = analyzeMoveSequence(item.sequence);
  console.log(`Seq: ${item.sequence.padEnd(14)} | Expected Order: ${String(item.order).padEnd(5)} | Computed: ${String(result.totalOrder).padEnd(5)} | Corner: ${result.cornerCycleStr} | Edge: ${result.edgeCycleStr}`);
}
