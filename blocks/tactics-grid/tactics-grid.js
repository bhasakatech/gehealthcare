import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the block
 *
 * Renders the voice "Writing tactics" matrix (matches the live site): a left
 * label rail (Tactic 1/2/3) plus one column per principle. Each authored row is
 * one principle: [title, subtitle, tactic1, tactic2, tactic3]. The block
 * transposes these into a grid with a header row and one row per tactic.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // First cell of the block model holds the comma-separated row labels.
  // It renders as the first row's ... actually rowLabels is a block-level field,
  // which AEM places as a leading single-cell row. Detect and consume it.
  // Empty by default: a grid with no real labels (e.g. Dos/Don'ts) shows a
  // blank left rail, matching the live site.
  let rowLabels = [];
  let markerImg = null;
  const columns = [];

  // Strip stray wrapping quotes/whitespace so a junk label cell authored as
  // `"",""` collapses to empty instead of rendering bogus `""` row labels.
  const cleanLabel = (s) => s.trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');

  rows.forEach((row) => {
    const cells = [...row.children];
    // A principle column has 4 cells; the block-level fields (rowLabels text +
    // optional marker image) each render as a leading single-cell row.
    if (cells.length === 1) {
      const img = cells[0].querySelector('img');
      if (img) {
        // Optional marker icon field: shown above every tactic in the grid.
        markerImg = img;
      } else {
        const txt = cells[0].textContent.trim();
        if (txt) rowLabels = txt.split(',').map(cleanLabel).filter(Boolean);
      }
      return;
    }
    const [headingCell, t1, t2, t3] = cells;
    columns.push({ row, heading: headingCell, tactics: [t1, t2, t3] });
  });

  const grid = document.createElement('div');
  grid.className = 'tactics-grid-table';
  grid.style.setProperty('--tactics-cols', columns.length);

  // Grids with no authored row labels (e.g. Dos/Don'ts) drop the left label
  // rail entirely and use divider lines above each cell, matching the live
  // site. Labelled grids (Writing tactics, Before & afters) keep the rail.
  const hasLabels = rowLabels.length > 0;
  if (!hasLabels) grid.classList.add('tactics-grid-unlabeled');

  // Header row: empty corner (only for labelled grids) + each principle's
  // title/subtitle.
  if (hasLabels) {
    const corner = document.createElement('div');
    corner.className = 'tactics-grid-corner';
    grid.append(corner);
  }

  columns.forEach((col) => {
    const head = document.createElement('div');
    head.className = 'tactics-grid-head';
    moveInstrumentation(col.row, head);
    // Heading cell holds the principle title (heading) + subtitle as rich text.
    if (col.heading) {
      while (col.heading.firstChild) head.append(col.heading.firstChild);
      const h = head.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) h.classList.add('tactics-grid-title');
      head.querySelectorAll('p').forEach((p) => p.classList.add('tactics-grid-subtitle'));
    }
    grid.append(head);
  });

  // Build the optional marker icon once (it's the same across every cell).
  // Returns a fresh <span> per call, or null when no marker was authored.
  const markerSrc = markerImg?.src;
  const markerAlt = markerImg?.alt || '';
  const makeMarker = () => {
    if (!markerSrc) return null;
    const marker = document.createElement('span');
    marker.className = 'tactics-grid-marker';
    marker.append(createOptimizedPicture(markerSrc, markerAlt, false, [{ width: '200' }]));
    return marker;
  };

  // One grid row per tactic: left label + each column's tactic cell.
  const filled = (c) => c.tactics.filter((t) => t && t.textContent.trim()).length;
  const tacticCount = Math.max(...columns.map(filled), 0);
  for (let i = 0; i < tacticCount; i += 1) {
    // The left label rail only exists on labelled grids; unlabeled grids skip
    // it so the columns start flush left (no empty first column / gap).
    if (hasLabels) {
      const label = document.createElement('div');
      label.className = 'tactics-grid-label';
      if (rowLabels[i]) label.textContent = rowLabels[i];
      grid.append(label);
    }

    columns.forEach((col) => {
      const cell = document.createElement('div');
      cell.className = 'tactics-grid-cell';
      const src = col.tactics[i];
      // Move the authored content in first.
      if (src) while (src.firstChild) cell.append(src.firstChild);

      // Some content was authored with a literal status emoji (e.g. a
      // paragraph that is just "❌"/"✅"). Drop that stray emoji paragraph so it
      // can be represented by the marker icon instead. A paragraph counts as a
      // stray marker when, after removing whitespace and the known status
      // glyphs (and any emoji variation selectors), nothing is left.
      const statusGlyphs = ['✅', '❌', '✔', '✖', '✗', '✘', '️'];
      const isEmojiOnly = (s) => {
        let rest = s.trim();
        statusGlyphs.forEach((g) => { rest = rest.split(g).join(''); });
        return rest.trim() === '';
      };
      [...cell.children].forEach((el) => {
        if (el.tagName === 'P' && el.textContent.trim() && isEmojiOnly(el.textContent)) {
          el.remove();
        }
      });

      const hasText = cell.textContent.trim();
      // The authored marker icon (optional dialog field) is shown above each
      // non-empty tactic — matching the live ✗/✓ markers. Only rendered when a
      // marker was authored AND the tactic has content; no marker field means
      // no extra DOM at all.
      if (hasText) {
        const marker = makeMarker();
        if (marker) cell.prepend(marker);
      }
      grid.append(cell);
    });
  }

  block.replaceChildren(grid);
}
