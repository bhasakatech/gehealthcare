import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Principle Cards — the "experience principles" flip-card grid (our-brand).
 *
 * A responsive grid of purple cards mirroring the live Avada flip-box:
 *   - front: the icon (an :token: icon span) + the heading (H4)
 *   - back:  the short description, revealed on hover/focus with a 3D flip
 *
 * Each card is authored as a single rich-text cell containing the icon, the
 * heading and the description. The icon + heading form the card front; the
 * remaining description forms the back. Cards are keyboard focusable so the
 * back is reachable without a pointer (touch / no-hover devices).
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'principle-cards-list';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;

    const li = document.createElement('li');
    li.className = 'principle-card';
    li.tabIndex = 0;
    moveInstrumentation(row, li);

    const inner = document.createElement('div');
    inner.className = 'principle-card-inner';

    // Front: icon + heading.
    const front = document.createElement('div');
    front.className = 'principle-card-face principle-card-front';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'principle-card-icon';
    const iconSpan = cell.querySelector('span.icon');
    if (iconSpan) {
      // Drop the (empty) paragraph that only wrapped the icon.
      const host = iconSpan.closest('p');
      iconWrap.append(iconSpan);
      if (host && !host.textContent.trim() && !host.querySelector('img, a')) host.remove();
    }
    front.append(iconWrap);

    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) front.append(heading);

    // Back: whatever remains (the description).
    const back = document.createElement('div');
    back.className = 'principle-card-face principle-card-back';
    while (cell.firstChild) back.append(cell.firstChild);

    inner.append(front, back);
    li.append(inner);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
