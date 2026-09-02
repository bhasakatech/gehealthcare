/**
 * Color Swatches — the "Usage & accessibility" contrast cards on the Color page.
 *
 * On the live brand hub each "On <color>, text should be …" entry is a rounded
 * card filled with that color, holding the heading plus a small grid of
 * AA/AAA pass labels. In the imported EDS content these arrive as flat default
 * content (an <h4> followed by paragraphs), so this block groups each heading
 * with its following paragraphs into a colored card and lays the cards out in a
 * responsive grid.
 *
 * The block is built automatically from the flat content (see scripts.js
 * buildAutoBlocks → buildColorSwatches), one row per swatch: a single cell
 * holding the <h4> heading and its pass/fail paragraphs.
 *
 * @param {Element} block
 */

// Swatch background + text colors keyed by the named color in the heading.
// Values taken from the live page's computed styles. The `match` is tested
// against the "On <color>" prefix only, so "On white … or Compassion Purple"
// resolves to white, not purple.
const SWATCHES = [
  {
    match: 'white', bg: '#fff', fg: '#222', border: true,
  },
  { match: 'black', bg: '#222', fg: '#fff' },
  { match: 'compassion purple', bg: '#6022a6', fg: '#fff' },
  { match: 'coral', bg: '#f37f63', fg: '#222' },
  {
    match: 'yellow', bg: '#edc50c', fg: '#222', border: true,
  },
  { match: 'green', bg: '#19bb7c', fg: '#222' },
  { match: 'turquoise', bg: '#45b2c5', fg: '#222' },
  { match: 'gray a', bg: '#8d8d8d', fg: '#222' },
  {
    match: 'gray b', bg: '#a9a9a9', fg: '#222', border: true,
  },
  { match: 'gray c', bg: '#d3d3d3', fg: '#222' },
  { match: 'gray d', bg: '#e3e3e3', fg: '#222' },
];

function swatchFor(label) {
  // Only look at the color name in the "On <color>, text should be …" prefix,
  // so trailing mentions of other colors (e.g. "or Compassion Purple") don't
  // steer the match.
  const prefix = (label.split(/,|\btext should\b/i)[0] || label).toLowerCase();
  return SWATCHES.find((s) => prefix.includes(s.match)) || null;
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('div');
    card.className = 'color-swatch';
    while (cell.firstChild) card.append(cell.firstChild);

    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    const label = (heading?.textContent || '').trim();
    const swatch = swatchFor(label);
    if (swatch) {
      card.style.setProperty('--swatch-bg', swatch.bg);
      card.style.setProperty('--swatch-fg', swatch.fg);
      if (swatch.border) card.classList.add('color-swatch-bordered');
    }

    // Wrap the pass/fail paragraphs (everything after the heading) in a labels
    // container so they can be laid out as a two-column grid.
    const labels = document.createElement('div');
    labels.className = 'color-swatch-labels';
    let node = heading?.nextSibling;
    while (node) {
      const next = node.nextSibling;
      labels.append(node);
      node = next;
    }
    if (labels.childNodes.length) card.append(labels);

    row.replaceWith(card);
  });
}
