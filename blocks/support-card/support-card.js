/**
 * Support Card — a small "For support" contact block.
 *
 * Modelled (see _support-card.json) with a heading and a rich-text body that
 * typically holds a contact line and a mailto link. Rendered with an envelope
 * icon between the heading and the body, matching the brand-hub sidebar design.
 * Reusable anywhere; commonly placed beneath the Section Nav in a sidebar.
 *
 * Authored cells: [heading, body].
 *
 * @param {Element} block
 */
const ENVELOPE = `<svg class="support-card-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M3 5h18v14H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

export default function decorate(block) {
  const rows = [...block.children];
  const headingCell = rows[0]?.children[0];
  const bodyCell = rows[1]?.children[0] || rows[0]?.children[1];

  const card = document.createElement('div');
  card.className = 'support-card-inner';

  const headingText = headingCell?.textContent.trim();
  if (headingText) {
    const heading = document.createElement('p');
    heading.className = 'support-card-title';
    heading.textContent = headingText;
    card.append(heading);
  }

  card.insertAdjacentHTML('beforeend', ENVELOPE);

  const body = document.createElement('div');
  body.className = 'support-card-body';
  if (bodyCell) {
    while (bodyCell.firstChild) body.append(bodyCell.firstChild);
  }
  card.append(body);

  block.replaceChildren(card);
}
