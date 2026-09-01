import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Principle Cards — the "experience principles" icon-card grid (our-brand).
 *
 * A responsive grid of cards; each card holds an icon (an :token: icon span),
 * a title (H4) and a short description. Mirrors the live flip-box grid,
 * rendered as static cards.
 *
 * Each card is authored as a single rich-text cell containing the icon, the
 * heading and the description. The icon span is lifted into its own icon slot.
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
    moveInstrumentation(row, li);

    // Icon: lift a leading icon span into its own slot.
    const iconWrap = document.createElement('div');
    iconWrap.className = 'principle-card-icon';
    const iconSpan = cell.querySelector('span.icon');
    if (iconSpan) {
      // Drop the (empty) paragraph that only wrapped the icon.
      const host = iconSpan.closest('p');
      iconWrap.append(iconSpan);
      if (host && !host.textContent.trim() && !host.querySelector('img, a')) host.remove();
    }
    li.append(iconWrap);

    // Body: whatever remains (heading + description).
    const body = document.createElement('div');
    body.className = 'principle-card-body';
    while (cell.firstChild) body.append(cell.firstChild);
    li.append(body);

    ul.append(li);
  });

  block.replaceChildren(ul);
}
