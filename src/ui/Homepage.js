/**
 * Homepage Component
 * Implements Section 5 of specification:
 * - Specific palette: Golden Sandstone (#8A724C), Amber Tresses (#B99668), Silken Dune (#DCC9A7), Champagne Veil (#EDE2CC), Ivory Whisper (#F7F3E8).
 * - Hero with "CubeLab", subtitle, navigation buttons, stats.
 * - Section 5.2 How a Rubik's Cube Works: 6 centres, 12 edges, 8 corners, face turns U, D, L, R, F, B, prime, superscript 2.
 * - Section 5.3 Abstract Algebra Learning Section: Groups, Generators, Cyclic groups (⟨R⟩ buttons for R, R², R³, R⁴), Permutation groups, Inverses & Identity, Conjugation & Commutators, Configuration space (43,252,003,274,489,856,000 reachable states) & God's Number 20.
 * - Section 5.4 Interactive Flowchart: Physical cube -> Legal turns -> Permutations -> Move sequences -> Group structure -> Algorithms & solving.
 */

export function renderHomepage(container, { onNavigate, onRunExperiment }) {
  container.innerHTML = `
    <div class="view-homepage">
      <!-- HERO -->
      <section class="hero-section">
        <div class="hero-badge">Undergraduate Abstract Algebra & Group Theory</div>
        <h1 class="hero-title">Cube<span>Lab</span></h1>
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

        <div class="hero-stats-bar">
          <div class="stat-item">
            <span class="stat-value">4.33 × 10¹⁸</span>
            <span class="stat-label">Reachable Group States</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">20 Moves</span>
            <span class="stat-label">God’s Number (Half-Turn Metric)</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">6 Generators</span>
            <span class="stat-label">⟨U, D, L, R, F, B⟩ Basis</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">1260</span>
            <span class="stat-label">Max Element Order in Group</span>
          </div>
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
              Each edge piece has 2 colored stickers and bridges two adjacent faces. Legal face turns permute edges among the 12 edge slots and can flip their orientation in ℤ₂ (total flip invariant ≡ 0 mod 2).
            </p>
          </div>

          <div class="mechanic-card">
            <div class="mechanic-count">8</div>
            <h3 class="mechanic-title">Corner Pieces</h3>
            <p class="mechanic-text">
              Each corner piece has 3 colored stickers and sits at the intersection of three perpendicular faces. Legal face turns permute corners among the 8 corner slots and twist them in ℤ₃ (total twist invariant ≡ 0 mod 3).
            </p>
          </div>
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.75rem;">Standard Move Notation (Singmaster)</h3>
        <p style="color: var(--c-muted-brown); margin-bottom: 1.5rem;">
          Each move is represented by a capital letter corresponding to its face viewed directly from the exterior. A clockwise quarter-turn (90°) is written as the bare letter. A prime symbol (′) signifies an inverse turn (-90° counterclockwise). A superscript 2 indicates a half-turn (180°).
        </p>

        <div class="notation-table-grid">
          <div class="notation-card"><div class="notation-letter">U</div><div class="notation-desc">Up Face (White)</div></div>
          <div class="notation-card"><div class="notation-letter">D</div><div class="notation-desc">Down Face (Yellow)</div></div>
          <div class="notation-card"><div class="notation-letter">F</div><div class="notation-desc">Front Face (Green)</div></div>
          <div class="notation-card"><div class="notation-letter">B</div><div class="notation-desc">Back Face (Blue)</div></div>
          <div class="notation-card"><div class="notation-letter">L</div><div class="notation-desc">Left Face (Orange)</div></div>
          <div class="notation-card"><div class="notation-letter">R</div><div class="notation-desc">Right Face (Red)</div></div>
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
        <div class="section-tag">University Abstract Algebra Syllabus (TMAT302L)</div>
        <h2 class="section-heading">Mathematical Group Theory on the Cube</h2>
        <p class="section-desc">
          The collection of all states reachable from the solved cube forms a finite group \(G\) acting on the set of piece positions and orientations. Here is the formal correspondence with the core syllabus modules.
        </p>

        <div class="math-modules-grid">
          <!-- 1. Groups & Axioms -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Module 1 &bull; Group Axioms</div>
              <h3 class="math-card-title">Groups and Group Axioms</h3>
              <p class="math-card-body">
                The set of cube transformations satisfies all 4 fundamental group axioms:
                <br>&bull; <strong>Closure:</strong> Composing two valid face turns produces another legal configuration.
                <br>&bull; <strong>Associativity:</strong> Grouping does not alter outcome: \((AB)C = A(BC)\).
                <br>&bull; <strong>Identity:</strong> The null transformation \(e\) leaves all 26 cubies in place.
                <br>&bull; <strong>Inverses:</strong> Every rotation \(X\) has an inverse \(X'\) such that \(X X' = X' X = e\).
              </p>
            </div>
            <div class="math-formula-box">G = (S, \circ) \quad \text{where} \quad X X^{-1} = X^{-1} X = e</div>
            <button class="math-card-action" data-nav="lab">Test Inverses in Lab &rarr;</button>
          </div>

          <!-- 2. Generators -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Module 2 &bull; Generating Sets</div>
              <h3 class="math-card-title">Generating Sets</h3>
              <p class="math-card-body">
                The six elementary face rotations generate the entire cube group \(G\):
                \[G = \langle U, D, L, R, F, B \rangle\]
                Any reachable state among the 43 quintillion possibilities can be expressed as a finite word in these 6 generators and their inverses.
              </p>
            </div>
            <div class="math-formula-box">G = \langle U, D, L, R, F, B \rangle \subset S_8 \ltimes \mathbb{Z}_3^8 \times S_{12} \ltimes \mathbb{Z}_2^{12}</div>
            <button class="math-card-action" data-nav="lab">Inspect Generators &rarr;</button>
          </div>

          <!-- 3. Cyclic Groups & Element Orders -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Module 2 &bull; Cyclic Subgroups</div>
              <h3 class="math-card-title">Cyclic Subgroups: \(\langle R \rangle\)</h3>
              <p class="math-card-body">
                Applying \(R\) four times returns every right-face sticker to its initial position: \(R^4 = e\). Thus, \(R\) generates a cyclic subgroup of order 4 isomorphic to \(\mathbb{Z}_4\):
              </p>
            </div>
            <div class="math-formula-box">\langle R \rangle = \{e, R, R^2, R^3\}, \quad \text{ord}(R) = 4</div>
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
              <div class="math-card-badge">Module 3 &bull; Permutation Groups</div>
              <h3 class="math-card-title">Permutation Cycles in \(S_8 \times S_{12}\)</h3>
              <p class="math-card-body">
                From Table 1 of the paper, a single quarter turn \(R\) produces disjoint 4-cycles on corner slots and edge slots:
              </p>
            </div>
            <div class="math-formula-box">
              \text{Corners: } (URF \; UBR \; DRB \; DFR) <br>
              \text{Edges: } (UR \; BR \; DR \; FR)
            </div>
            <button class="math-card-action" data-nav="lab">View Live Permutation Cycles &rarr;</button>
          </div>

          <!-- 5. Conjugation & Commutators -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Module 4 &bull; Conjugacy & Solvability</div>
              <h3 class="math-card-title">Conjugation & Commutators</h3>
              <p class="math-card-body">
                <strong>Conjugation:</strong> \(A B A^{-1}\) acts as a setup move (\(A\)), executing a transformation (\(B\)), and undoing the setup (\(A^{-1}\)).
                <br><br>
                <strong>Commutator:</strong> \([A, B] = A B A^{-1} B^{-1}\) measures non-commutativity. Because \(A\) and \(B\) cancel most common pieces, a commutator produces highly isolated, localized cycles!
              </p>
            </div>
            <div class="math-formula-box">[R, U] = R U R' U', \quad \text{ord}([R, U]) = 6</div>
            <button class="math-card-action exp-btn" data-alg="R U R' U'">Execute Commutator [R, U] &rarr;</button>
          </div>

          <!-- 6. Configuration Space & God's Number -->
          <div class="math-card">
            <div>
              <div class="math-card-badge">Configuration Space & Invariants</div>
              <h3 class="math-card-title">Group Order & God’s Number</h3>
              <p class="math-card-body">
                Total unrestricted arrangements are \(8! \cdot 3^8 \cdot 12! \cdot 2^{12}\). Applying the three parity, twist, and flip legality invariants divides this by \(2 \times 3 \times 2 = 12\):
                \[|G| = \frac{8! \cdot 12! \cdot 3^8 \cdot 2^{12}}{12} = 43{,}252{,}003{,}274{,}489{,}856{,}000\]
                <strong>God’s Number:</strong> Proved in 2010 by Rokicki et al., every reachable configuration can be solved in at most <strong>20 moves</strong> under the Half-Turn Metric (HTM).
              </p>
            </div>
            <div class="math-formula-box">|G| \approx 4.325 \times 10^{18}, \quad \text{Diameter}(G) = 20 \text{ (HTM)}</div>
            <button class="math-card-action" data-nav="solver">Solve Current Cube &rarr;</button>
          </div>
        </div>
      </section>
    </div>
  `;

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
