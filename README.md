# CubeLab

**An Interactive 3D Rubik’s Cube & Abstract Algebra Visualization Platform**

CubeLab is an interactive, browser-based mathematical simulation and learning environment connecting the physical motions and algorithms of the Rubik's Cube with university-level abstract algebra (specifically Group Theory, Permutations in $S_8 \times S_{12}$, Cyclic Subgroups, Conjugation, Commutators, and Solvability).

---

## 🌟 Key Features

1. **High-Fidelity 3D Rubik's Cube Engine (Three.js)**
   - 27-cubie construction with minimal black gaps between cubies and realistic sticker boundaries.
   - Fixed center spider core: center pieces remain in their true geometric reference positions.
   - Interactive face & sticker selection via raycasting on world normals: clicking a sticker identifies its face, cubie type (Corner, Edge, Center), and allows direct rotation.
   - Full 18-move support: $\{U, D, L, R, F, B\}$ quarter turns, inverse primes $\{U', D', L', R', F', B'\}$, and half-turns $\{U2, D2, L2, R2, F2, B2\}$.
   - Layer rotation animation queue ensuring physical state and logical state remain synchronized without visual corruption.

2. **Manual Cube Lab (Immersive Dark Theme)**
   - Two-column responsive layout with interactive particle & cursor gradient backdrop.
   - Complete 18-move generator keypad and sticker rotation controls.
   - Real-time **Latest Move Telemetry**: Move notation, affected face, turn direction, and move number.
   - **Unified Move History & State Timeline**: Step backward and forward through prior states, undo, redo, and review past sessions.
   - **Live Group Theory Permutation Decomposition**:
     - Decomposes any current cube state into disjoint cycle notation on Corner slots ($1-8$) and Edge slots ($1-12$).
     - Evaluates cycle lengths, net orientation twists ($\mathbb{Z}_3$) and flips ($\mathbb{Z}_2$), parity of permutations, and exact element order ($\text{lcm}$).

3. **Automatic Scramble and Solver Mode**
   - **Official Scrambler**: Generates pseudo-random scramble algorithms avoiding redundant face oscillations.
   - **Playback Controls**: Play scramble, step forward, step backward, pause, and reset.
   - **Herbert Kociemba Two-Phase Solver**: Computes solutions to any reachable scrambled cube state in at most 22 moves (HTM) in under $50\,\text{ms}$.
   - **Interactive Solution Playback**: Step through solution moves with active badges, progress counters, and final state programmatic verification.

4. **Editorial Homepage & Syllabus Learning Section**
   - Palette: Golden Sandstone (`#8A724C`), Amber Tresses (`#B99668`), Silken Dune (`#DCC9A7`), Champagne Veil (`#EDE2CC`), and Ivory Whisper (`#F7F3E8`).
   - Mechanical breakdown of 6 centers, 12 edges, 8 corners, and standard Singmaster move notation.
   - Direct correspondence to undergraduate abstract algebra syllabus (Groups, Group Axioms, Generators, Cyclic Subgroups $\langle R \rangle$, Permutation Groups in $S_8 \times S_{12}$, Conjugation $ABA^{-1}$, Commutators $[A, B]$, Configuration Space of $4.325 \times 10^{18}$ states, and God's Number 20 HTM).
   - Interactive 6-stage abstraction flowchart from physical cube turns to algorithms.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/ak478595/abstract-cube.git
cd abstract-cube

# Install dependencies
npm install

# Start local development server with Vite
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production
```bash
npm run build
```

The production distribution will be bundled into `dist/`.

---

## 🧪 Mathematical & Engine Verification

Run the automated group theory and cube engine test suite:
```bash
node test_table3.js
```

This verifies the element orders and permutation cycle structures of the reference paper (including $[R, U]$, $(R^2 U^2)$, and max-order sequence $R\,U^2\,D'\,B\,D'$ of order $1260$).

---

## 📚 Mathematical Reference
- **Author**: Aadi Krishnan, Department of Integrated M.Sc. Mathematics, Vellore Institute of Technology (VIT).
- **Curriculum**: TMAT302L Abstract Algebra (Group Theory, Cyclic Groups, Permutation Groups, Solvability).
- **References**:
  1. T. Rokicki, H. Kociemba, M. Davidson, J. Dethridge, *The diameter of the Rubik's Cube group is twenty*, SIAM J. Discrete Math 27 (2013).
  2. D. Joyner, *Adventures in Group Theory: Rubik's Cube, Merlin's Machine, and Other Mathematical Toys*, Johns Hopkins University Press.
  3. D. Singmaster, *Notes on Rubik's Magic Cube*, Enslow Publishers, 1981.
