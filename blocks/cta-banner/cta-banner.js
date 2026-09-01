import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VALID_STYLES = ['purple', 'dark', 'image', 'light'];

export default function decorate(block) {
  // 2. Extract configuration from authored cells:
  // [text, button (collapsed link+text), backgroundImage, style]
  // Support both layouts: a single row with 4 cells, or 4 stacked single-cell rows.
  const rows = [...block.children];
  const firstRowCells = rows[0] ? [...rows[0].children] : [];
  const cells = firstRowCells.length > 1
    ? firstRowCells
    : rows.map((row) => row.firstElementChild || row);

  const [textCell, buttonCell, bgImageCell, styleCell] = cells;

  const styleValue = (styleCell?.textContent.trim() || '').toLowerCase();
  const style = VALID_STYLES.includes(styleValue) ? styleValue : 'purple';

  // Detect a style set as a variant class on the block instead of a field.
  const variantStyle = VALID_STYLES.find((s) => block.classList.contains(s));
  const activeStyle = variantStyle || style;

  const backgroundImg = bgImageCell?.querySelector('img');
  const hasImage = activeStyle === 'image' || !!backgroundImg;

  // 3. Transform DOM
  const inner = document.createElement('div');
  inner.className = 'cta-banner-inner';

  // Text content (heading + body)
  const content = document.createElement('div');
  content.className = 'cta-banner-content';
  if (textCell) {
    moveInstrumentation(rows[0], content);
    while (textCell.firstChild) content.append(textCell.firstChild);
  }
  inner.append(content);

  // Button: collapsed field renders as an anchor whose href is the link
  // and whose text is the button label.
  const buttonAnchor = buttonCell?.querySelector('a');
  const buttonLink = buttonAnchor?.href || buttonCell?.textContent.trim() || '';
  const buttonText = buttonAnchor?.textContent.trim() || buttonCell?.textContent.trim() || '';
  if (buttonLink && buttonText) {
    const p = document.createElement('p');
    p.className = 'button-wrapper';
    const anchor = document.createElement('a');
    anchor.href = buttonLink;
    anchor.className = 'button primary';
    anchor.textContent = buttonText;
    p.append(anchor);
    inner.append(p);
  }

  // Background image with overlay
  if (backgroundImg) {
    const bg = document.createElement('div');
    bg.className = 'cta-banner-bg';
    const optimizedPic = createOptimizedPicture(
      backgroundImg.src,
      backgroundImg.alt || '',
      false,
      [{ width: '2000' }],
    );
    moveInstrumentation(backgroundImg, optimizedPic.querySelector('img'));
    bg.append(optimizedPic);
    block.prepend(bg);
  }

  // 4. Apply style class and render
  block.classList.add(`cta-banner-style-${activeStyle}`);
  if (hasImage) block.classList.add('cta-banner-style-has-image');

  block.querySelectorAll(':scope > div:not(.cta-banner-bg)').forEach((row) => row.remove());
  block.append(inner);
}
