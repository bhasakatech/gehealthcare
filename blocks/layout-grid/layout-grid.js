import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Layout Grid — the Design elements "Layout system" grid diagrams.
 *
 * On the live brand hub this section shows the 6-column and 12-column grid
 * diagrams side by side, with a small labeled thumbnail row (Margins / Gutters
 * / Columns) beneath. The import scattered these into separate content-media
 * blocks and bare full-size <picture> paragraphs, so an auto-block
 * (scripts.js buildLayoutGrid) collects the pieces and hands them here.
 *
 * Structure (rows built by the auto-block):
 *   row 1: two cells → 6-column grid image, 12-column grid image
 *   row 2: three cells, each → a caption + a thumbnail image
 *          (Margins / Gutters / Columns)
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Row 1 — the two big grid diagrams, side by side, each with its label on top.
  const grids = document.createElement('div');
  grids.className = 'layout-grid-diagrams';
  const gridRow = rows[0];
  if (gridRow) {
    [...gridRow.children].forEach((cell) => {
      const img = cell.querySelector('img');
      if (!img) return;
      const alt = img.getAttribute('alt') || '';
      const fig = document.createElement('div');
      fig.className = 'layout-grid-diagram';
      if (alt) {
        const label = document.createElement('p');
        label.className = 'layout-grid-label';
        const strong = document.createElement('strong');
        strong.textContent = alt;
        label.append(strong);
        fig.append(label);
      }
      fig.append(createOptimizedPicture(img.getAttribute('src'), alt, false, [{ width: '750' }]));
      grids.append(fig);
    });
  }

  // Row 2 — the small Margins / Gutters / Columns thumbnails with labels.
  const thumbs = document.createElement('div');
  thumbs.className = 'layout-grid-thumbs';
  const thumbRow = rows[1];
  if (thumbRow) {
    [...thumbRow.children].forEach((cell) => {
      const img = cell.querySelector('img');
      const label = (cell.textContent || '').trim();
      if (!img) return;
      const item = document.createElement('div');
      item.className = 'layout-grid-thumb';
      item.append(createOptimizedPicture(img.getAttribute('src'), label, false, [{ width: '400' }]));
      if (label) {
        const cap = document.createElement('p');
        cap.className = 'layout-grid-thumb-label';
        cap.textContent = label;
        item.append(cap);
      }
      thumbs.append(item);
    });
  }

  block.replaceChildren(grids);
  if (thumbs.childElementCount) block.append(thumbs);
}
