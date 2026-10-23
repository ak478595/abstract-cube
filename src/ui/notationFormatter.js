/**
 * Notation Formatting Utilities
 *
 * Provides high-contrast, crystal-clear rendering for Rubik's Cube move notation,
 * specifically optimized for classroom projection on whiteboards.
 *
 * Ensures:
 * - Large monospace lettering
 * - Unmistakable prime marks (′) with distinct accent styling and high contrast
 * - Unmistakable half-turn digits (2) with subscript/badge clarity
 * - Generous letter-spacing and word-spacing
 * - Support for HTML badge/chip rendering and accessible plain text
 */

/**
 * Split a move into base face letter and modifier (e.g. "U'" -> { face: 'U', mod: "'" })
 */
export function parseMoveToken(moveStr) {
  if (!moveStr || typeof moveStr !== 'string') return { face: '', mod: '' };
  const trimmed = moveStr.trim();
  if (trimmed.length === 0) return { face: '', mod: '' };
  const face = trimmed[0];
  const mod = trimmed.slice(1);
  return { face, mod };
}

/**
 * Returns accessible semantic HTML for a move with clear differentiation of prime (') and 2.
 */
export function formatMoveHTML(moveStr, { extraClass = '', isCurrent = false, isDone = false } = {}) {
  const { face, mod } = parseMoveToken(moveStr);
  if (!face) return '';

  let modHtml = '';
  if (mod.includes("'") || mod.includes("′")) {
    modHtml = `<span class="move-prime-mark" aria-label="prime">′</span>`;
  } else if (mod.includes('2')) {
    modHtml = `<span class="move-double-digit" aria-label="two">2</span>`;
  }

  const stateClass = isCurrent ? 'step-current' : isDone ? 'step-done' : '';
  const classes = ['solution-step-badge', stateClass, extraClass].filter(Boolean).join(' ');

  return `<span class="${classes}" data-move="${moveStr}"><span class="move-face-char">${face}</span>${modHtml}</span>`;
}

/**
 * Returns formatted HTML sequence string for a list of moves with clear projector spacing.
 */
export function formatSequenceHTML(movesOrString) {
  if (!movesOrString) return '';
  const list = Array.isArray(movesOrString) 
    ? movesOrString 
    : movesOrString.trim().split(/\s+/).filter(Boolean);
  
  if (list.length === 0) return '';
  return list.map(m => {
    const { face, mod } = parseMoveToken(m);
    let modHtml = '';
    if (mod.includes("'") || mod.includes("′")) {
      modHtml = `<span class="seq-prime">′</span>`;
    } else if (mod.includes('2')) {
      modHtml = `<span class="seq-two">2</span>`;
    }
    return `<span class="seq-token"><span class="seq-face">${face}</span>${modHtml}</span>`;
  }).join(' ');
}

