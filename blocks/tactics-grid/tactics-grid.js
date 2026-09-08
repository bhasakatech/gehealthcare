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
  let rowLabels = ['Tactic 1', 'Tactic 2', 'Tactic 3'];
  const columns = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    // A principle column has 4 cells; the block-level rowLabels row has 1.
    if (cells.length === 1) {
      const txt = cells[0].textContent.trim();
      if (txt) rowLabels = txt.split(',').map((s) => s.trim()).filter(Boolean);
      return;
    }
    const [headingCell, t1, t2, t3] = cells;
    columns.push({ row, heading: headingCell, tactics: [t1, t2, t3] });
  });

  const grid = document.createElement('div');
  grid.className = 'tactics-grid-table';
  grid.style.setProperty('--tactics-cols', columns.length);

  // Header row: empty corner + each principle's title/subtitle.
  const corner = document.createElement('div');
  corner.className = 'tactics-grid-corner';
  grid.append(corner);

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

  // One grid row per tactic: left label + each column's tactic cell.
  const filled = (c) => c.tactics.filter((t) => t && t.textContent.trim()).length;
  const tacticCount = Math.max(...columns.map(filled), 0);
  for (let i = 0; i < tacticCount; i += 1) {
    const label = document.createElement('div');
    label.className = 'tactics-grid-label';
    label.textContent = rowLabels[i] || `Tactic ${i + 1}`;
    grid.append(label);

    columns.forEach((col) => {
      const cell = document.createElement('div');
      cell.className = 'tactics-grid-cell';
      const src = col.tactics[i];
      if (src) while (src.firstChild) cell.append(src.firstChild);
      grid.append(cell);
    });
  }

  block.replaceChildren(grid);
}
