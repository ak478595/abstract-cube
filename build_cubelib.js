import fs from 'fs';

let c1 = fs.readFileSync('node_modules/cubejs/lib/cube.js', 'utf8');
let c2 = fs.readFileSync('node_modules/cubejs/lib/solve.js', 'utf8');

// Replace the end of cube.js so that Cube is attached to global scope / returned
const target1 = `  //# Globals
  if (typeof module !== "undefined" && module !== null) {
    module.exports = Cube;
  } else {
    this.Cube = Cube;
  }`;

const replace1 = `  globalThis.Cube = Cube;`;
c1 = c1.replace(target1, replace1);

// In solve.js, ensure Cube reference is obtained from globalThis.Cube
const target2 = `  Cube = this.Cube || require('./cube');`;
const replace2 = `  Cube = globalThis.Cube;`;
c2 = c2.replace(target2, replace2);

const output = `// Auto-generated ESM bundle for Cube.js
${c1}

${c2}

const CubeExport = globalThis.Cube;
export default CubeExport;
export { CubeExport as Cube };
`;

fs.writeFileSync('src/core/cube-lib.js', output, 'utf8');
console.log('src/core/cube-lib.js generated successfully!');

