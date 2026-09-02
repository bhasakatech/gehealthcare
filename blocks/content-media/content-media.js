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
  let layout = LAYOUTS.includes(authoredLayout)
    ? authoredLayout
    : (variantLayout || 'text-left');

  // Decide when to keep the side-by-side split vs. go full-width. The 2/3 + 1/3
  // hero split only makes sense for a rich text side (with a heading). When the
  // text is empty or just a short caption/label (no heading), the live design
  // shows the image full-width — so drop the split so the image isn't squeezed
  // into the narrow 1/3 column.
  const textIsEmpty = !(textCell?.textContent || '').trim()
    && !textCell?.querySelector('img, a, ul, ol, table');
  const hasImage = !!imageCell?.querySelector('img');
  const hasHeading = !!textCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (hasImage && (layout === 'text-left' || layout === 'text-right') && !hasHeading) {
    layout = textIsEmpty ? 'image-only' : 'caption';
  }

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
