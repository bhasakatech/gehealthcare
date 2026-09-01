import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Feature Card — the homepage "Brand training" split section.
 *
 * A two-column layout on a two-tone background (light top half, GE purple bottom
 * half). The left column holds a square image that overlaps the card; the right
 * column is a white card with an eyebrow, heading, body copy and a button.
 *
 * Authored cells: [image, text(eyebrow + h2 + body), button, buttonText].
 * Supports a single multi-cell row or field-per-row (hinted) layout.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstRowCells = rows[0] ? [...rows[0].children] : [];
  const cells = firstRowCells.length > 1
    ? firstRowCells
    : rows.map((r) => r.firstElementChild || r);

  const [imageCell, textCell, buttonCell, buttonTextCell] = cells;

  // --- Image column ---
  const media = document.createElement('div');
  media.className = 'feature-card-media';
  const img = imageCell?.querySelector('img');
  if (img) {
    const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    media.append(optimized);
  }

  // --- White card column ---
  const card = document.createElement('div');
  card.className = 'feature-card-body';
  if (textCell) {
    moveInstrumentation(rows[0], card);
    while (textCell.firstChild) card.append(textCell.firstChild);
  }
  // Tag the first paragraph before the heading as an eyebrow.
  const heading = card.querySelector('h1, h2, h3');
  if (heading) {
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) prev.classList.add('feature-card-eyebrow');
  }

  // --- Button (collapsed link+text: anchor href = link, anchor text = label) ---
  const buttonAnchor = buttonCell?.querySelector('a');
  const href = buttonAnchor?.getAttribute('href') || buttonCell?.textContent.trim() || '';
  const label = (buttonTextCell?.textContent.trim())
    || (buttonAnchor && buttonAnchor.textContent.trim() !== href ? buttonAnchor.textContent.trim() : '')
    || '';
  if (href && label) {
    const p = document.createElement('p');
    p.className = 'button-wrapper';
    const a = document.createElement('a');
    a.href = href;
    a.className = 'button primary';
    a.textContent = label;
    p.append(a);
    card.append(p);
  }

  block.replaceChildren(media, card);
}
