import katex from 'katex';

/**
 * Typesets mathematical formulas inside a container using KaTeX.
 * Supports elements with [data-formula] or [data-formula-display] attributes.
 */
export function typesetMath(container) {
  if (!container) return;

  // Render display formulas
  container.querySelectorAll('[data-formula-display]').forEach((el) => {
    const tex = el.getAttribute('data-formula-display');
    if (tex) {
      try {
        katex.render(tex, el, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX display render error:', e);
      }
    }
  });

  // Render inline formulas
  container.querySelectorAll('[data-formula-inline]').forEach((el) => {
    const tex = el.getAttribute('data-formula-inline');
    if (tex) {
      try {
        katex.render(tex, el, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX inline render error:', e);
      }
    }
  });
}

