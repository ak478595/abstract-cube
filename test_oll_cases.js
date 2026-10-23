import Cube from './src/core/cube-lib.js';

// The 7 standard 2-Look OLL corner orientation cases:
// Solved EO means edges 0, 1, 2, 3 have eo === 0.
// We want to orient corners 0, 1, 2, 3 so that co === 0.

const CO_ALGS_7 = {
  // 1. Sune: 1 corner oriented (co=0), 3 clockwise
  sune: "R U R' U R U2 R'",
  // 2. Anti-Sune: 1 corner oriented, 3 counter-clockwise
  antisune: "R U2 R' U' R U' R'",
  // 3. H: 0 corners oriented, 2 opposite pairs (headlights on front and back)
  h: "R U R' U R U' R' U R U2 R'",
  // 4. Pi: 0 corners oriented, 1 pair of headlights + 2 pointing away
  pi: "R U2 R2 U' R2 U' R2 U2 R",
  // 5. Headlights (U case): 2 corners oriented, 2 adjacent pointing front
  headlights: "R2 D R' U2 R D' R' U2 R'",
  // 6. T case: 2 corners oriented, 2 adjacent pointing opposite
  t: "r U R' U' r' F R F'",
  // 7. Bowtie (L case): 2 diagonal corners oriented
  bowtie: "F' r U R' U' r' F R"
};

// Test if wide turns r and r' in T and Bowtie preserve D-Cross and F2L:
for (const [name, alg] of Object.entries(CO_ALGS_7)) {
  const c = new Cube();
  c.move(alg);
  const crossOk = c.ep[4]===4 && c.ep[5]===5 && c.ep[6]===6 && c.ep[7]===7 &&
                  c.eo[4]===0 && c.eo[5]===0 && c.eo[6]===0 && c.eo[7]===0;
  const f2lOk = c.cp[4]===4 && c.cp[5]===5 && c.cp[6]===6 && c.cp[7]===7 &&
                c.ep[8]===8 && c.ep[9]===9 && c.ep[10]===10 && c.ep[11]===11;
  const centersOk = c.center[0]===0 && c.center[1]===1 && c.center[2]===2 &&
                    c.center[3]===3 && c.center[4]===4 && c.center[5]===5;
  console.log(`Case ${name.padEnd(12)}: crossOk=${crossOk}, f2lOk=${f2lOk}, centersOk=${centersOk}`);
}
