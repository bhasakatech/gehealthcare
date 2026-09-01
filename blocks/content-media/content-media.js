import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const LAYOUTS = ['text-left', 'text-right', 'text-only', 'image-only'];

/**
 * loads and decorates the content-media block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstRowCells = rows[0] ? [...rows[0].children] : [];
  // Support a single multi-cell row or field-per-row (stacked single-cell rows).
  const cells = firstRowCells.length > 1
    ? firstRowCells
    : rows.map((r) => r.firstElementChild || r);
  const [textCell, imageCell, layoutCell] = cells;

  // Determine layout: authored select cell wins, otherwise a variant class,
  // otherwise the default.
  const authoredLayout = layoutCell?.textContent.trim();
  const variantLayout = LAYOUTS.find((l) => block.classList.contains(l));
  const layout = LAYOUTS.includes(authoredLayout)
    ? authoredLayout
    : (variantLayout || 'text-left');

  // Text side
  const text = document.createElement('div');
  text.className = 'content-media-text';
  if (textCell) {
    moveInstrumentation(textCell, text);
    while (textCell.firstChild) text.append(textCell.firstChild);
  }
  // Tag the first paragraph before the heading as an eyebrow.
  const heading = text.querySelector('h1, h2, h3');
  if (heading) {
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) prev.classList.add('content-media-eyebrow');
  }

  // Image side
  const figure = document.createElement('div');
  figure.className = 'content-media-figure';
  const img = imageCell?.querySelector('img');
  if (img) {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    figure.append(optimizedPic);
  }

  block.classList.add(layout);

  const children = [];
  if (layout !== 'image-only') children.push(text);
  if (layout !== 'text-only' && img) children.push(figure);
  block.replaceChildren(...children);
}
