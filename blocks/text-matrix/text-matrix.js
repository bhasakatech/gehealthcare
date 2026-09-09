import { moveInstrumentation } from '../../scripts/scripts.js';

const COLUMN_CLASSES = ['columns-2', 'columns-3', 'columns-4'];

/**
 * loads and decorates the block
 *
 * Renders a row of equal text columns (matches the live motion "Calm / Balanced
 * / Concise" layout): each column is a bold heading above body copy. Column
 * count comes from the authored `columns-2|3|4` class (default 3). Each authored
 * row is one column of rich text.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const list = document.createElement('div');
  list.className = 'text-matrix-list';

  rows.forEach((row) => {
    const cell = row.firstElementChild;
    const col = document.createElement('div');
    col.className = 'text-matrix-col';
    moveInstrumentation(row, col);
    if (cell) {
      while (cell.firstChild) col.append(cell.firstChild);
      // Tag a leading heading so it can be styled as the column title.
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) heading.classList.add('text-matrix-title');
    }
    list.append(col);
  });

  // Default to 3 columns when the author hasn't chosen one.
  if (!COLUMN_CLASSES.some((c) => block.classList.contains(c))) {
    block.classList.add('columns-3');
  }

  block.replaceChildren(list);
}
