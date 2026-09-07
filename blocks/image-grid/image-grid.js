import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const COLUMN_CLASSES = ['columns-1', 'columns-2', 'columns-3'];

/**
 * loads and decorates the block
 *
 * Renders a responsive grid of images (matches the live legal-page image rows:
 * 2-up / 3-up `imageframe` grids). Column count comes from the authored
 * `columns-1|2|3` class (default 2). Each item: [image, alt, caption].
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const ul = document.createElement('ul');
  ul.className = 'image-grid-list';

  rows.forEach((row) => {
    const cells = [...row.children];
    const [imageCell, altCell, captionCell] = cells;
    const img = imageCell?.querySelector('img');
    const alt = altCell?.textContent.trim() || img?.alt || '';
    const caption = captionCell?.textContent.trim() || '';

    const li = document.createElement('li');
    li.className = 'image-grid-item';
    moveInstrumentation(row, li);

    if (img) {
      const optimized = createOptimizedPicture(img.src, alt, false, [{ width: '750' }]);
      const figure = document.createElement('figure');
      figure.className = 'image-grid-figure';
      figure.append(optimized);
      if (caption) {
        const figcaption = document.createElement('figcaption');
        figcaption.className = 'image-grid-caption';
        figcaption.textContent = caption;
        figure.append(figcaption);
      }
      li.append(figure);
    }

    ul.append(li);
  });

  // Default to 2 columns when the author hasn't chosen one.
  if (!COLUMN_CLASSES.some((c) => block.classList.contains(c))) {
    block.classList.add('columns-2');
  }

  block.replaceChildren(ul);
}
