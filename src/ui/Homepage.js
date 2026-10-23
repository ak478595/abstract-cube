/**
 * Homepage Component - Redesigned
 * Focuses on the Three Solving Methodologies:
 * 1. Herbert Kociemba's Two-Phase Algorithm (Implemented & Verified)
 * 2. Layer-by-Layer (LBL) Beginner Method (Implemented & Verified)
 * 3. CFOP-X Method (Experimental / Implemented & Verified)
 *
 * Includes:
 * - Editorial Palette Hero & Quick Navigation
 * - Three Detailed Solver Cards with Status Badges, Strategies, & Audited Benchmark Stats
 * - Interactive Mechanics & Standard Notation Section
 */

import { typesetMath } from '../core/mathTypeset.js';

export function renderHomepage(container, { onNavigate, onRunExperiment }) {
  container.innerHTML = `
    <div class="view-homepage">
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="hero-badge">Algorithmic &amp; Algebraic Framework</div>
        <h1 class="hero-title">Cube <span>Simulator</span></h1>
        <p class="hero-subtitle">
          An interactive computational platform bridging 3D puzzle mechanics, abstract algebra, and three distinct algorithmic solving paradigms: Kociemba Two-Phase, Layer-by-Layer, and CFOP-X.
        </p>

        <div class="hero-actions">
          <button class="btn-editorial-primary" id="btn-hero-solver">
            Explore Automatic Solver &rarr;
          </button>
          <button class="btn-editorial-secondary" id="btn-hero-lab">
            Launch Cube Simulator &rarr;
          </button>
        </div>
      </section>

      <!-- SECTION 1: THE THREE SOLVING PARADIGMS -->
      <section class="editorial-section" id="section-solvers">
        <div class="section-tag">Comparative Algorithmic Analysis</div>
        <h2 class="section-heading">Three Approaches to Rubik's Cube Solution</h2>
        <p class="section-desc">
          Cube Simulator benchmarks three fundamentally different algorithmic methodologies on identical scramble states, highlighting the mathematical trade-offs between offline coset graph search, beginner procedural reduction, and speedcubing lookahead.
        </p>

        <div class="math-modules-grid" style="margin-top: 1.5rem; grid-template-columns: repeat(3, 1fr);">
          <!-- 1. KOCIEMBA TWO-PHASE -->
          <div class="math-card">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span class="math-card-badge" style="color: var(--c-sandstone);">Coset Graph Search</span>
                <span class="home-solver-badge status-live">&#10003; Implemented &amp; Verified</span>
              </div>
              <h3 class="math-card-title">Herbert Kociemba's Two-Phase</h3>
              <p class="math-card-body">
                Traverses cosets of the subgroup <span data-formula-inline="H = \\langle U, D, R^2, L^2, F^2, B^2 \\rangle"></span> using precomputed lookup tables. Phase 1 reduces the cube from the general group <span data-formula-inline="G"></span> into <span data-formula-inline="H"></span>, and Phase 2 drives the state from <span data-formula-inline="H"></span> to the solved identity <span data-formula-inline="e"></span>.
              </p>

              <div class="solver-card-specs">
                <div class="spec-row">
                  <span class="spec-label">Move Optimality:</span>
                  <span class="spec-val">Near-optimal (20–22 HTM, close to God's Number)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Warm Compute Speed:</span>
                  <span class="spec-val">~30–50 ms per solve (measured)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Offline Init Cost:</span>
                  <span class="spec-val">~1.3–2.4 s (pruning &amp; coordinate tables)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Human Executability:</span>
                  <span class="spec-val">Low (requires massive machine lookup tables)</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <button class="math-card-action" data-nav="solver">Benchmark in Solver &rarr;</button>
              <button class="math-card-action" data-nav="lab" style="background: var(--c-champagne);">Inspect in Simulator &rarr;</button>
            </div>
          </div>

          <!-- 2. LAYER-BY-LAYER (LBL) -->
          <div class="math-card">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span class="math-card-badge" style="color: #2563EB;">Staged Reduction</span>
                <span class="home-solver-badge status-live">&#10003; Implemented &amp; Verified</span>
              </div>
              <h3 class="math-card-title">Layer-by-Layer (LBL) Method</h3>
              <p class="math-card-body">
                The standard beginner human method. Solves the puzzle procedurally in four strict stages: First-Layer Cross (Daisy method) &rarr; First-Layer Corners &rarr; Middle-Layer Edges &rarr; Last-Layer Orientation and Permutation (OLL/PLL).
              </p>

              <div class="solver-card-specs">
                <div class="spec-row">
                  <span class="spec-label">Move Optimality:</span>
                  <span class="spec-val">Pedagogical (110–185 HTM, ~165 QTM)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Compute Speed:</span>
                  <span class="spec-val">&lt; 1 ms (instantaneous procedural reduction)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Offline Init Cost:</span>
                  <span class="spec-val">0.00 ms (Zero precomputed lookup tables)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Human Executability:</span>
                  <span class="spec-val">Very High (intuitive, localized invariant isolation)</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <button class="math-card-action" data-nav="solver">Compare with Kociemba &rarr;</button>
              <button class="math-card-action" data-nav="lab" style="background: var(--c-champagne);">Inspect in Simulator &rarr;</button>
            </div>
          </div>

          <!-- 3. CFOP-X (EXPERIMENTAL) -->
          <div class="math-card">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span class="math-card-badge" style="color: #10B981;">Speedcubing &amp; Lookahead</span>
                <span class="home-solver-badge status-live" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #10B981;">&#9679; Experimental (Verified)</span>
              </div>
              <h3 class="math-card-title">CFOP-X (Cross-F2L-OLL-PLL)</h3>
              <p class="math-card-body">
                Our staged speedcubing solver implementing Cross with multi-candidate lookahead, cost-aware F2L pair insertion, 2-look OLL edge &amp; corner orientation, and 2-look PLL corner &amp; pure conjugate edge permutation.
              </p>

              <div class="solver-card-specs">
                <div class="spec-row">
                  <span class="spec-label">Pipeline:</span>
                  <span class="spec-val">Cross &rarr; F2L &rarr; 2-Look OLL &rarr; 2-Look PLL</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Move Length:</span>
                  <span class="spec-val">~120–145 HTM (Speedcubing standard)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Solve Time:</span>
                  <span class="spec-val">~25–40 ms per solve (100% verified)</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Lookahead Feature:</span>
                  <span class="spec-val" style="color: #10B981; font-weight: 600;">Cross evaluation + F2L pair preservation</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <button class="math-card-action" data-nav="solver">Benchmark in Solver &rarr;</button>
              <button class="math-card-action" data-nav="lab" style="background: var(--c-champagne);">Inspect in Simulator &rarr;</button>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: HOW A RUBIK'S CUBE WORKS -->
      <section class="editorial-section" id="section-mechanics">
        <div class="section-tag">Anatomy &amp; Geometry</div>
        <h2 class="section-heading">How a Rubik’s Cube Works</h2>
        <p class="section-desc">
          Although a 3&times;3&times;3 cube appears to consist of 27 individual cubes, its core mechanism holds the 6 centre pieces in a rigid internal spider axle. Only the 20 perimeter pieces permute and reorient through outer face turns.
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

        <h3 style="font-family: var(--font-serif); font-size: 1.4rem; margin-top: 2rem; margin-bottom: 0.75rem;">Standard Move Notation (HTM Basis)</h3>
        <p style="color: var(--c-muted-brown); margin-bottom: 1.5rem;">
          Each move is represented by a capital letter corresponding to its face viewed directly from the exterior. A clockwise quarter-turn (90&deg;) is written as the bare letter. A prime symbol (&prime;) signifies an inverse turn (-90&deg; counterclockwise). A superscript 2 indicates a half-turn (180&deg;).
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
    </div>
  `;

  // Typeset all math formulas via KaTeX
  typesetMath(container);

  // Navigation button event listeners
  container.querySelector('#btn-hero-solver')?.addEventListener('click', () => onNavigate('solver'));
  container.querySelector('#btn-hero-lab')?.addEventListener('click', () => onNavigate('lab'));

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
