/**
 * AboutView - Dedicated Full Page View for About the Project
 */

export function renderAboutView(container, { onNavigate }) {
  container.innerHTML = `
    <div class="view-about-page">
      <div class="about-page-container">
        <header class="about-page-header">
          <div class="hero-badge">VIT Undergraduate Capstone</div>
          <h1 class="about-page-title">About Cube Simulator</h1>
          <p class="about-page-subtitle">
            An interactive computational platform bridging 3D visualization, algorithmic solving, and group theory.
          </p>
        </header>

        <div class="about-grid">
          <div class="about-card">
            <h3 class="about-card-title">Academic & Mathematical Foundations</h3>
            <p class="about-card-text">
              Cube Simulator is based on the research project <em>"A Group-Theoretic and Computational Analysis of the Rubik's Cube"</em> authored by <strong>Aadi Krishnan</strong> at the Department of Mathematics, Vellore Institute of Technology (VIT).
            </p>
            <p class="about-card-text" style="margin-top: 0.75rem;">
              The platform connects the 18 standard face-turn generators to syllabus modules of <strong>TMAT302L Abstract Algebra</strong>: Group Axioms, Cyclic Subgroups \(\langle R \rangle\), Disjoint Permutations in \(S_8 \times S_{12}\), Commutators \([A, B]\), and the configuration space of \(43{,}252{,}003{,}274{,}489{,}856{,}000\) states.
            </p>
          </div>

          <div class="about-card">
            <h3 class="about-card-title">Computational Engine Architecture</h3>
            <p class="about-card-text">
              The application couples an authoritative logical state engine with a high-fidelity <strong>Three.js</strong> 3D WebGL renderer.
            </p>
            <ul style="margin-top: 0.75rem; padding-left: 1.25rem; color: var(--lab-text-muted); font-size: 0.95rem; line-height: 1.6;">
              <li><strong>Physical Geometry:</strong> 27 solid cubies with minimal inter-cubie seams and realistic sticker borders.</li>
              <li><strong>Interactive Raycasting:</strong> Direct face-picking via world normals rather than camera angles.</li>
              <li><strong>Solver Algorithm:</strong> Herbert Kociemba's two-phase algorithm finding solutions in \(\le 22\) moves (HTM).</li>
              <li><strong>Permutation Decomposition:</strong> Live decomposition into disjoint cycle notation with orientation parity and element orders.</li>
            </ul>
          </div>
        </div>

        <div class="about-card" style="margin-top: 1.5rem;">
          <h3 class="about-card-title">Project References</h3>
          <ol style="margin-top: 0.75rem; padding-left: 1.25rem; color: var(--lab-text-muted); font-size: 0.92rem; line-height: 1.6;">
            <li>T. Rokicki, H. Kociemba, M. Davidson, J. Dethridge, <em>The diameter of the Rubik's Cube group is twenty</em>, SIAM J. Discrete Math 27 (2013).</li>
            <li>D. Joyner, <em>Adventures in Group Theory: Rubik's Cube, Merlin's Machine, and Other Mathematical Toys</em>, Johns Hopkins University Press.</li>
            <li>D. Singmaster, <em>Notes on Rubik's Magic Cube</em>, Enslow Publishers, 1981.</li>
            <li>T. Sun, <em>Commutators in the Rubik's Cube Group</em>, The American Mathematical Monthly 131 (2023).</li>
          </ol>
        </div>

        <div style="margin-top: 2rem; text-align: center;">
          <button class="btn-action-primary" id="about-goto-lab">
            Enter Manual Cube Lab &rarr;
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#about-goto-lab')?.addEventListener('click', () => onNavigate('lab'));
}

