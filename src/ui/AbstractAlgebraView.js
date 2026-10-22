/**
 * AbstractAlgebraView - Dedicated Full Page View for Abstract Algebra Syllabus
 * Modules 1-4 matching VIT syllabus TMAT302L
 */

export function renderAbstractAlgebraView(container, { onNavigate, onRunExperiment }) {
  container.innerHTML = `
    <div class="view-algebra-page">
      <div class="algebra-page-container">
        <header class="algebra-page-header">
          <div class="hero-badge">Curriculum & Theory</div>
          <h1 class="algebra-page-title">Abstract Algebra & Group Theory</h1>
          <p class="algebra-page-subtitle">
            A comprehensive mapping between the Rubik’s Cube transformations and formal university abstract algebra.
          </p>
          <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn-action-primary" id="algebra-goto-lab">
              Open Manual Cube Lab &rarr;
            </button>
            <button class="btn-action-secondary" id="algebra-goto-solver">
              Open Automatic Solver &rarr;
            </button>
          </div>
        </header>

        <!-- 6-Stage Flowchart -->
        <section class="algebra-section-card">
          <div class="section-tag">Curriculum Progression</div>
          <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: #FFF; margin-bottom: 1rem;">
            The Abstraction Pipeline
          </h2>
          <div class="flowchart-container" style="background: rgba(31, 41, 55, 0.7); border-color: var(--lab-border);">
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

          <div class="flowchart-details-panel" id="algebra-flowchart-details" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-accent);">
            <!-- Populated via script -->
          </div>
        </section>

        <!-- Syllabus Modules Grid -->
        <div class="math-modules-grid" style="margin-top: 2rem;">
          <!-- 1. Groups & Axioms -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Group Axioms</div>
              <h3 class="math-card-title" style="color: #FFF;">Groups and Group Axioms</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                The set of cube transformations satisfies all 4 fundamental group axioms:
                <br>&bull; <strong>Closure:</strong> Composing two valid face turns produces another legal configuration.
                <br>&bull; <strong>Associativity:</strong> Grouping does not alter outcome: \((AB)C = A(BC)\).
                <br>&bull; <strong>Identity:</strong> The null transformation \(e\) leaves all 26 cubies in place.
                <br>&bull; <strong>Inverses:</strong> Every rotation \(X\) has an inverse \(X'\) such that \(X X' = X' X = e\).
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              G = (S, \circ) \quad \text{where} \quad X X^{-1} = X^{-1} X = e
            </div>
            <button class="math-card-action" data-nav="lab" style="background: var(--lab-surface-elevated); color: var(--lab-accent); border: 1px solid var(--lab-border);">
              Test Inverses in Lab &rarr;
            </button>
          </div>

          <!-- 2. Generators -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Generating Sets</div>
              <h3 class="math-card-title" style="color: #FFF;">Generating Sets</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                The six elementary face rotations generate the entire cube group \(G\):
                \[G = \langle U, D, L, R, F, B \rangle\]
                Any reachable state among the 43 quintillion possibilities can be expressed as a finite word in these 6 generators and their inverses.
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              G = \langle U, D, L, R, F, B \rangle \subset S_8 \ltimes \mathbb{Z}_3^8 \times S_{12} \ltimes \mathbb{Z}_2^{12}
            </div>
            <button class="math-card-action" data-nav="lab" style="background: var(--lab-surface-elevated); color: var(--lab-accent); border: 1px solid var(--lab-border);">
              Inspect Generators &rarr;
            </button>
          </div>

          <!-- 3. Cyclic Groups & Element Orders -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Cyclic Subgroups</div>
              <h3 class="math-card-title" style="color: #FFF;">Cyclic Subgroups: \(\langle R \rangle\)</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                Applying \(R\) four times returns every right-face sticker to its initial position: \(R^4 = e\). Thus, \(R\) generates a cyclic subgroup of order 4 isomorphic to \(\mathbb{Z}_4\):
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              \langle R \rangle = \{e, R, R^2, R^3\}, \quad \text{ord}(R) = 4
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="math-card-action exp-btn" data-alg="R" style="background: var(--lab-surface-elevated); color: #FFF; border: 1px solid var(--lab-border);">Apply R</button>
              <button class="math-card-action exp-btn" data-alg="R2" style="background: var(--lab-surface-elevated); color: #FFF; border: 1px solid var(--lab-border);">Apply R²</button>
              <button class="math-card-action exp-btn" data-alg="R R R" style="background: var(--lab-surface-elevated); color: #FFF; border: 1px solid var(--lab-border);">Apply R³</button>
              <button class="math-card-action exp-btn" data-alg="R R R R" style="background: var(--lab-surface-elevated); color: #FFF; border: 1px solid var(--lab-border);">Apply R⁴ = e</button>
            </div>
          </div>

          <!-- 4. Permutation Groups & Cycle Notation -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Permutation Groups</div>
              <h3 class="math-card-title" style="color: #FFF;">Permutation Cycles in \(S_8 \times S_{12}\)</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                From Table 1 of the paper, a single quarter turn \(R\) produces disjoint 4-cycles on corner slots and edge slots:
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              \text{Corners: } (URF \; UBR \; DRB \; DFR) <br>
              \text{Edges: } (UR \; BR \; DR \; FR)
            </div>
            <button class="math-card-action" data-nav="lab" style="background: var(--lab-surface-elevated); color: var(--lab-accent); border: 1px solid var(--lab-border);">
              View Live Permutation Cycles &rarr;
            </button>
          </div>

          <!-- 5. Conjugation & Commutators -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Conjugacy & Solvability</div>
              <h3 class="math-card-title" style="color: #FFF;">Conjugation & Commutators</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                <strong>Conjugation:</strong> \(A B A^{-1}\) acts as a setup move (\(A\)), executing a transformation (\(B\)), and undoing the setup (\(A^{-1}\)).
                <br><br>
                <strong>Commutator:</strong> \([A, B] = A B A^{-1} B^{-1}\) measures non-commutativity. Because \(A\) and \(B\) cancel most common pieces, a commutator produces highly isolated, localized cycles!
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              [R, U] = R U R' U', \quad \text{ord}([R, U]) = 6
            </div>
            <button class="math-card-action exp-btn" data-alg="R U R' U'" style="background: var(--lab-surface-elevated); color: var(--lab-accent); border: 1px solid var(--lab-border);">
              Execute Commutator [R, U] &rarr;
            </button>
          </div>

          <!-- 6. Configuration Space & God's Number -->
          <div class="math-card" style="background: rgba(17, 24, 39, 0.9); border-color: var(--lab-border); color: #FFF;">
            <div>
              <div class="math-card-badge" style="color: var(--lab-accent);">Configuration Space & Invariants</div>
              <h3 class="math-card-title" style="color: #FFF;">Group Order & God’s Number</h3>
              <p class="math-card-body" style="color: var(--lab-text-muted);">
                Total unrestricted arrangements are \(8! \cdot 3^8 \cdot 12! \cdot 2^{12}\). Applying the three parity, twist, and flip legality invariants divides this by \(2 \times 3 \times 2 = 12\):
                \[|G| = \frac{8! \cdot 12! \cdot 3^8 \cdot 2^{12}}{12} = 43{,}252{,}003{,}274{,}489{,}856{,}000\]
                <strong>God’s Number:</strong> Proved in 2010 by Rokicki et al., every reachable configuration can be solved in at most <strong>20 moves</strong> under the Half-Turn Metric (HTM).
              </p>
            </div>
            <div class="math-formula-box" style="background: var(--lab-surface-elevated); color: #FFF; border-left-color: var(--lab-accent);">
              |G| \approx 4.325 \times 10^{18}, \quad \text{Diameter}(G) = 20 \text{ (HTM)}
            </div>
            <button class="math-card-action" data-nav="solver" style="background: var(--lab-surface-elevated); color: var(--lab-accent); border: 1px solid var(--lab-border);">
              Solve Current Cube &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Flowchart logic
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

  const detailsView = container.querySelector('#algebra-flowchart-details');
  const stepElements = container.querySelectorAll('.flowchart-step');

  function showFlowchartStep(idx) {
    stepElements.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    const info = flowchartSteps[idx];
    detailsView.innerHTML = `
      <h4 class="flowchart-details-title" style="color: var(--lab-accent);">${info.title}</h4>
      <p class="flowchart-details-text" style="color: var(--lab-text);">${info.desc}</p>
    `;
  }

  stepElements.forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-step'), 10);
      showFlowchartStep(idx);
    });
  });

  showFlowchartStep(0);

  container.querySelector('#algebra-goto-lab')?.addEventListener('click', () => onNavigate('lab'));
  container.querySelector('#algebra-goto-solver')?.addEventListener('click', () => onNavigate('solver'));

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

