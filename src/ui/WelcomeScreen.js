/**
 * WelcomeScreen Component - User-Controlled Animated 2D Geometric Cube Screen
 */

export class WelcomeScreen {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.overlay = null;
    this.hasEnded = false;
  }

  show() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'welcome-overlay';
    this.overlay.id = 'welcome-screen';

    // Geometrically precise 2D Rubik's Cube representation (3x3 grid)
    // Coordinated with editorial & cube palette: Ivory, White, Red, Blue, Amber, Green
    this.overlay.innerHTML = `
      <div class="welcome-content">
        <div class="welcome-title-wrapper">
          <h1 class="welcome-title">Cube <span>Simulator</span></h1>
          <p class="welcome-subtitle">Interactive 3D Transformations & Abstract Algebra</p>
        </div>

        <div class="welcome-cube-stage">
          <svg class="welcome-cube-svg" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="2D Rubik's Cube Illustration">
            <defs>
              <filter id="tileShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#8A724C" flood-opacity="0.15" />
              </filter>
            </defs>

            <!-- Background chassis plate -->
            <rect x="25" y="25" width="250" height="250" rx="16" fill="#18181B" />

            <!-- Row 1: Corners & Edge Up -->
            <g class="tile tile-corner-tl" filter="url(#tileShadow)">
              <rect x="36" y="36" width="70" height="70" rx="8" fill="#FFFFFF" stroke="#2A2621" stroke-width="1.5" />
            </g>
            <g class="tile tile-up" filter="url(#tileShadow)">
              <rect x="115" y="36" width="70" height="70" rx="8" fill="#C41E3A" stroke="#2A2621" stroke-width="1.5" />
            </g>
            <g class="tile tile-corner-tr" filter="url(#tileShadow)">
              <rect x="194" y="36" width="70" height="70" rx="8" fill="#0051BA" stroke="#2A2621" stroke-width="1.5" />
            </g>

            <!-- Row 2: Edge Left, Center, Edge Right -->
            <g class="tile tile-left" filter="url(#tileShadow)">
              <rect x="36" y="115" width="70" height="70" rx="8" fill="#FF5800" stroke="#2A2621" stroke-width="1.5" />
            </g>
            <g class="tile tile-center" filter="url(#tileShadow)">
              <rect x="115" y="115" width="70" height="70" rx="8" fill="#FFD500" stroke="#2A2621" stroke-width="1.5" />

            </g>
            <g class="tile tile-right" filter="url(#tileShadow)">
              <rect x="194" y="115" width="70" height="70" rx="8" fill="#009E60" stroke="#2A2621" stroke-width="1.5" />
            </g>

            <!-- Row 3: Corners & Edge Down -->
            <g class="tile tile-corner-bl" filter="url(#tileShadow)">
              <rect x="36" y="194" width="70" height="70" rx="8" fill="#009E60" stroke="#2A2621" stroke-width="1.5" />
            </g>
            <g class="tile tile-down" filter="url(#tileShadow)">
              <rect x="115" y="194" width="70" height="70" rx="8" fill="#FFFFFF" stroke="#2A2621" stroke-width="1.5" />
            </g>
            <g class="tile tile-corner-br" filter="url(#tileShadow)">
              <rect x="194" y="194" width="70" height="70" rx="8" fill="#C41E3A" stroke="#2A2621" stroke-width="1.5" />
            </g>
          </svg>
        </div>

        <button class="welcome-enter-btn welcome-skip-btn" id="welcome-enter-btn" aria-label="Enter Cube Simulator">
          <span>Enter Cube Simulator</span> &rarr;
        </button>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const enterBtn = this.overlay.querySelector('#welcome-enter-btn');
    enterBtn?.addEventListener('click', () => this.handleEnter());
    // Also support any legacy id reference
    this.overlay.querySelector('#welcome-skip-btn')?.addEventListener('click', () => this.handleEnter());

    // Focus the entry button so keyboard users can press Enter/Space immediately
    setTimeout(() => {
      enterBtn?.focus();
    }, 400);

    // IMPORTANT: No automatic timers! The welcome screen stays visible indefinitely
    // until the user explicitly clicks the entry button.
  }

  handleEnter() {
    if (this.hasEnded) return;
    this.hasEnded = true;

    const enterBtn = this.overlay.querySelector('#welcome-enter-btn');
    if (enterBtn) {
      enterBtn.disabled = true;
      enterBtn.style.pointerEvents = 'none';
      enterBtn.classList.add('btn-clicked');
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (this.overlay) {
        this.overlay.classList.add('fade-out');
      }
      setTimeout(() => this.cleanup(), 250);
      return;
    }

    // 1. Immediately animate the 2D cube opening/unfolding
    if (this.overlay) {
      this.overlay.classList.add('entering');
      this.overlay.classList.add('opening');
    }

    // 2. Coordinated smooth fade out into the homepage
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.classList.add('fade-out');
      }
    }, 950);

    // 3. Fully remove overlay from DOM, freeing pointer events & memory
    setTimeout(() => {
      this.cleanup();
    }, 1900);
  }

  cleanup() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }

  // Backwards compatibility if called externally
  dismiss() {
    this.handleEnter();
  }
}
