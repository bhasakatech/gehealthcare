import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Principle Cards — the "experience principles" flip-card grid (our-brand).
 *
 * A responsive grid of purple cards mirroring the live Avada flip-box:
 *   - front: the icon (an :token: icon span) + the title
 *   - back:  the short description, revealed on hover/focus with a 3D flip
 *
 * Each card is authored as three cells — icon, title, description — matching
 * the Principle Card model (icon, title, text). The icon + title form the card
 * front; the description forms the back. Cards are keyboard focusable so the
 * back is reachable without a pointer (touch / no-hover devices).
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'principle-cards-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [iconCell, titleCell, textCell] = cells;

    const li = document.createElement('li');
    li.className = 'principle-card';
    li.tabIndex = 0;
    moveInstrumentation(row, li);

    const inner = document.createElement('div');
    inner.className = 'principle-card-inner';

    // Front: icon + title.
    const front = document.createElement('div');
    front.className = 'principle-card-face principle-card-front';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'principle-card-icon';
    const iconSpan = iconCell?.querySelector('span.icon');
    if (iconSpan) iconWrap.append(iconSpan);
    front.append(iconWrap);

    const heading = document.createElement('h4');
    heading.className = 'principle-card-title';
    heading.textContent = (titleCell?.textContent || '').trim();
    front.append(heading);

    // Back: the description.
    const back = document.createElement('div');
    back.className = 'principle-card-face principle-card-back';
    if (textCell) {
      while (textCell.firstChild) back.append(textCell.firstChild);
    }

    inner.append(front, back);
    li.append(inner);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
