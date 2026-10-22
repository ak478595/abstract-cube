/**
 * Homepage Component
 * Implements Section 5 of specification with updated Cube Simulator design:
 * - Editorial Palette: Golden Sandstone (#8A724C), Amber Tresses (#B99668), Silken Dune (#DCC9A7), Champagne Veil (#EDE2CC), Ivory Whisper (#F7F3E8).
 * - Hero with "Cube Simulator", subtitle, navigation buttons.
 * - Entire statistics block removed completely.
 * - All mathematical formulae rendered using KaTeX LaTeX typesetting.
 * - Cleaned move labels: U (Up), D (Down), F (Front), B (Back), L (Left), R (Right).
 */

import { typesetMath } from '../core/mathTypeset.js';

export function renderHomepage(container, { onNavigate, onRunExperiment }) {
  container.innerHTML = `
    <div class="view-homepage">
      <!-- HERO -->
      <section class="hero-section">
        <h1 class="hero-title">Cube <span>Simulator</span></h1>
        <p class="hero-subtitle">
          Explore the Rubik’s Cube through interactive movements, algorithms, and abstract algebra.
        </p>

        <div class="hero-actions">
          <button class="btn-editorial-primary" id="btn-enter-lab">
            Enter Manual Cube Lab &rarr;
          </button>
          <button class="btn-editorial-secondary" id="btn-enter-solver">
            Enter Automatic Solver &rarr;
          </button>
        </div>
      </section>

      <!-- SECTION 5.2: HOW A RUBIK'S CUBE WORKS -->
      <section class="editorial-section" id="section-mechanics">
        <div class="section-tag">Anatomy & Geometry</div>
        <h2 class="section-heading">How a Rubik’s Cube Works</h2>
        <p class="section-desc">
          Although a 3×3×3 cube appears to consist of 27 individual cubes, its core mechanism holds the 6 centre pieces in a rigid internal spider axle. Only the 20 perimeter pieces permute and reorient through outer face turns.
        </p>

        <div class="mechanics-grid">
          <div class="mechanic-card">
            <div class="mechanic-count">6</div>
            <h3 class="mechanic-title">Centre Pieces</h3>
            <p class="mechanic-text">
              Each centre piece possesses a single colored sticker. Because they are mechanically anchored to the central core, their relative spatial positions never change. They define the fixed reference frame of the cube.
            </p>
          </div>

          <div class="mechanic-card">
            <div class="mechanic-count">12</div>
            <h3 class="mechanic-title">Edge Pieces</h3>
            <p class="mechanic-text">
              Each edge piece has 2 colored stickers and bridges two adjacent faces. Legal face turns permute edges among the 12 edge slots and can flip their orientation in <span data-formula-inline="\\mathbb{Z}_2"></span> (total flip invariant <span data-formula-inline="\\equiv 0 \\pmod{2}"></span>).
            </p>
          </div>

          <div class="mechanic-card">
            <div class="mechanic-count">8</div>
            <h3 class="mechanic-title">Corner Pieces</h3>
            <p class="mechanic-text">
              Each corner piece has 3 colored stickers and sits at the intersection of three perpendicular faces. Legal face turns permute corners among the 8 corner slots and twist them in <span data-formula-inline="\\mathbb{Z}_3"></span> (total twist invariant <span data-formula-inline="\\equiv 0 \\pmod{3}"></span>).
            </p>
          </div>
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.75rem;">Standard Move Notation</h3>
        <p style="color: var(--c-muted-brown); margin-bottom: 1.5rem;">
          Each move is represented by a capital letter corresponding to its face viewed directly from the exterior. A clockwise quarter-turn (90°) is written as the bare letter. A prime symbol (′) signifies an inverse turn (-90° counterclockwise). A superscript 2 indicates a half-turn (180°).
        </p>

        <div class="notation-table-grid">
          <div class="notation-card"><div class="notation-letter">U</div><div class="notation-desc">U (Up)</div></div>
          <div class="notation-card"><div class="notation-letter">D</div><div class="notation-desc">D (Down)</div></div>
          <div class="notation-card"><div class="notation-letter">F</div><div class="notation-desc">F (Front)</div></div>
          <div class="notation-card"><div class="notation-letter">B</div><div class="notation-desc">B (Back)</div></div>
          <div class="notation-card"><div class="notation-letter">L</div><div class="notation-desc">L (Left)</div></div>
          <div class="notation-card"><div class="notation-letter">R</div><div class="notation-desc">R (Right)</div></div>
        </div>
      </section>

      <!-- SECTION 5.4: LEARNING FLOWCHART -->
      <section class="editorial-section" id="section-flowchart">
        <div class="section-tag">Curriculum Progression</div>
        <h2 class="section-heading">From Physical Motion to Abstract Algebra</h2>
        <p class="section-desc">
          Click on any stage of the mathematical abstraction pipeline to explore how physical cube turns map directly to university abstract algebra concepts.
        </p>

        <div class="flowchart-container">
          <div class="flowchart-step active" data-step="0">
            <div class="flowchart-step-num">Step 1</div>
            <div class="flowchart-step-name">Physical Cube</div>
          </div>
          <span class="flowchart-arrow">&rarr;</span>
          <div class="flowchart-step" data-step="1">
            <div class="flowchart-step-num">Step 2</div>
            <div class="flowchart-step-name">Legal Face Turns</div>
          </div>
          <span class="flowchart-arrow">&rarr;</span>
          <div class="flowchart-step" data-step="2">
            <div class="flowchart-step-num">Step 3</div>
            <div class="flowchart-step-name">Permutations of Pieces</div>
          </div>
          <span class="flowchart-arrow">&rarr;</span>
          <div class="flowchart-step" data-step="3">
            <div class="flowchart-step-num">Step 4</div>
            <div class="flowchart-step-name">Move Sequences</div>
          </div>
          <span class="flowchart-arrow">&rarr;</span>
          <div class="flowchart-step" data-step="4">
            <div class="flowchart-step-num">Step 5</div>
            <div class="flowchart-step-name">Group Structure</div>
          </div>
          <span class="flowchart-arrow">&rarr;</span>
          <div class="flowchart-step" data-step="5">
            <div class="flowchart-step-num">Step 6</div>
            <div class="flowchart-step-name">Algorithms & Solving</div>
          </div>
        </div>

        <div class="flowchart-details-panel" id="flowchart-details-view">
          <!-- Dynamically populated -->
        </div>
      </section>

      <!-- SECTION 5.3: ABSTRACT ALGEBRA LEARNING SECTION -->
      <section class="editorial-section" id="section-algebra">
        <h2 class="section-heading">Mathematical Group Theory on the Cube</h2>
        <p class="section-desc">
          The collection of all states reachable from the solved cube forms a finite group <span data-formula-inline="G"></span> acting on the set of piece positions and orientations. Here is the formal correspondence with core syllabus concepts.
        </p>

        <div class="math-modules-grid">
          <!-- 1. Groups & Axioms -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Group Axioms</div>
              <h3 class="math-card-title">Groups and Group Axioms</h3>
              <p class="math-card-body">
                The set of cube transformations satisfies all 4 fundamental group axioms:
                <br>&bull; <strong>Closure:</strong> Composing two valid face turns produces another legal configuration.
                <br>&bull; <strong>Associativity:</strong> Grouping does not alter outcome: <span data-formula-inline="(AB)C = A(BC)"></span>.
                <br>&bull; <strong>Identity:</strong> The null transformation <span data-formula-inline="e"></span> leaves all 26 cubies in place.
                <br>&bull; <strong>Inverses:</strong> Every rotation <span data-formula-inline="X"></span> has an inverse <span data-formula-inline="X^{-1}"></span> such that <span data-formula-inline="X X^{-1} = X^{-1} X = e"></span>.
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="G = (S, \\circ) \\quad \\text{where} \\quad X X^{-1} = X^{-1} X = e"></div>
            <button class="math-card-action" data-nav="lab">Test Inverses in Lab &rarr;</button>
          </div>

          <!-- 2. Generators -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Generating Sets</div>
              <h3 class="math-card-title">Generating Sets</h3>
              <p class="math-card-body">
                The six elementary face rotations generate the entire cube group <span data-formula-inline="G"></span>:
                Any reachable state among the 43 quintillion possibilities can be expressed as a finite word in these 6 generators and their inverses.
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="G = \\langle U, D, L, R, F, B \\rangle \\subset S_8 \\ltimes \\mathbb{Z}_3^8 \\times S_{12} \\ltimes \\mathbb{Z}_2^{12}"></div>
            <button class="math-card-action" data-nav="lab">Inspect Generators &rarr;</button>
          </div>

          <!-- 3. Cyclic Groups & Element Orders -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Cyclic Subgroups</div>
              <h3 class="math-card-title">Cyclic Subgroups: <span data-formula-inline="\\langle R \\rangle"></span></h3>
              <p class="math-card-body">
                Applying <span data-formula-inline="R"></span> four times returns every right-face sticker to its initial position: <span data-formula-inline="R^4 = e"></span>. Thus, <span data-formula-inline="R"></span> generates a cyclic subgroup of order 4 isomorphic to <span data-formula-inline="\\mathbb{Z}_4"></span>:
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="\\langle R \\rangle = \\{e, R, R^2, R^3\\}, \\quad \\text{ord}(R) = 4"></div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="math-card-action exp-btn" data-alg="R">Apply R</button>
              <button class="math-card-action exp-btn" data-alg="R2">Apply R²</button>
              <button class="math-card-action exp-btn" data-alg="R R R">Apply R³</button>
              <button class="math-card-action exp-btn" data-alg="R R R R">Apply R⁴ = e</button>
            </div>
          </div>

          <!-- 4. Permutation Groups & Cycle Notation -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Permutation Groups</div>
              <h3 class="math-card-title">Permutation Cycles in <span data-formula-inline="S_8 \\times S_{12}"></span></h3>
              <p class="math-card-body">
                A single quarter turn <span data-formula-inline="R"></span> produces disjoint 4-cycles on corner slots and edge slots:
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="\\begin{aligned} \\text{Corners: } & (URF \\; UBR \\; DRB \\; DFR) \\\\ \\text{Edges: } & (UR \\; BR \\; DR \\; FR) \\end{aligned}"></div>
            <button class="math-card-action" data-nav="lab">View Live Permutation Cycles &rarr;</button>
          </div>

          <!-- 5. Conjugation & Commutators -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Conjugacy & Solvability</div>
              <h3 class="math-card-title">Conjugation & Commutators</h3>
              <p class="math-card-body">
                <strong>Conjugation:</strong> <span data-formula-inline="A B A^{-1}"></span> acts as a setup move (<span data-formula-inline="A"></span>), executing a transformation (<span data-formula-inline="B"></span>), and undoing the setup (<span data-formula-inline="A^{-1}"></span>).
                <br><br>
                <strong>Commutator:</strong> <span data-formula-inline="[A, B] = A B A^{-1} B^{-1}"></span> measures non-commutativity. Because <span data-formula-inline="A"></span> and <span data-formula-inline="B"></span> cancel most common pieces, a commutator produces highly isolated, localized cycles!
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="[R, U] = R U R^{-1} U^{-1}, \\quad \\text{ord}([R, U]) = 6"></div>
            <button class="math-card-action exp-btn" data-alg="R U R' U'">Execute Commutator [R, U] &rarr;</button>
          </div>

          <!-- 6. Configuration Space & God's Number -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Configuration Space & Invariants</div>
              <h3 class="math-card-title">Group Order & God’s Number</h3>
              <p class="math-card-body">
                Total unrestricted arrangements are <span data-formula-inline="8! \\cdot 3^8 \\cdot 12! \\cdot 2^{12}"></span>. Applying the three parity, twist, and flip legality invariants divides this by <span data-formula-inline="2 \\times 3 \\times 2 = 12"></span>:
                God’s Number: Every reachable configuration can be solved in at most 20 moves under the Half-Turn Metric (HTM) (Rokicki et al., 2010).
              </p>
            </div>
            <div class="math-formula-box" data-formula-display="|G| = \\frac{8! \\cdot 12! \\cdot 3^8 \\cdot 2^{12}}{12} = 43{,}252{,}003{,}274{,}489{,}856{,}000"></div>
            <button class="math-card-action" data-nav="solver">Solve Current Cube &rarr;</button>
          </div>
        </div>
      </section>
    </div>
  `;

  // Typeset all math formulas via KaTeX
  typesetMath(container);

  // Flowchart interactive steps data
  const flowchartSteps = [
    {
      title: "Stage 1: The Physical Cube",
      desc: "A mechanical 3D puzzle consisting of 6 fixed centers, 12 movable edges, and 8 corner pieces. Any physical manipulation is constrained by the central core mechanism."
    },
    {
      title: "Stage 2: Legal Face Turns",
      desc: "The only allowable atomic operations are 90° and 180° turns of the 6 outer layers: {U, D, L, R, F, B}. Slices are compositions of outer turns and whole-cube rotations."
    },
    {
      title: "Stage 3: Permutations of Pieces",
      desc: "Every face turn acts as a pair of permutations: a 4-cycle of corner slots in S₈ and a 4-cycle of edge slots in S₁₂, accompanied by well-defined orientation shifts in ℤ₃ and ℤ₂."
    },
    {
      title: "Stage 4: Move Sequences & Words",
      desc: "Concatenating face turns forms 'words' in the free group modulo the cube relations (e.g. R⁴ = e, (R U)²⁴ = e). Move composition is performed from left to right."
    },
    {
      title: "Stage 5: Group Structure (The Cube Group G)",
      desc: "The reachable states form a subgroup of the wreath product (S₈ ⋉ ℤ₃⁸) × (S₁₂ ⋉ ℤ₂¹²). The group order is exactly 43,252,003,274,489,856,000, governed by parity, twist, and flip conservation."
    },
    {
      title: "Stage 6: Algorithms, Commutators & Solving",
      desc: "Using commutators [A, B] = A B A⁻¹ B⁻¹ and conjugates A B A⁻¹, solvers isolate small orbits of pieces (like 3-cycles) to systematically restore the cube to identity e without disturbing solved parts."
    }
  ];

  const detailsView = container.querySelector('#flowchart-details-view');
  const stepElements = container.querySelectorAll('.flowchart-step');

  function showFlowchartStep(idx) {
    stepElements.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    const info = flowchartSteps[idx];
    detailsView.innerHTML = `
      <h4 class="flowchart-details-title">${info.title}</h4>
      <p class="flowchart-details-text">${info.desc}</p>
    `;
  }

  stepElements.forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-step'), 10);
      showFlowchartStep(idx);
    });
  });

  // Default to step 0
  showFlowchartStep(0);

  // Button navigation hooks
  container.querySelector('#btn-enter-lab')?.addEventListener('click', () => onNavigate('lab'));
  container.querySelector('#btn-enter-solver')?.addEventListener('click', () => onNavigate('solver'));

  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      onNavigate(target);
    });
  });

  container.querySelectorAll('.exp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const alg = btn.getAttribute('data-alg');
      if (typeof onRunExperiment === 'function') {
        onRunExperiment(alg);
      }
    });
  });
}
