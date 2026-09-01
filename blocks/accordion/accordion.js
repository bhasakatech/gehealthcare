import { moveInstrumentation } from '../../scripts/scripts.js';

const CHEVRON = `<svg class="accordion-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [titleCell, contentCell] = cells;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);

    // Summary holds the title text and a chevron
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-header';

    const title = document.createElement('span');
    title.className = 'accordion-item-title';
    if (titleCell) {
      while (titleCell.firstChild) title.append(titleCell.firstChild);
    }
    summary.append(title);
    summary.insertAdjacentHTML('beforeend', CHEVRON);
    details.append(summary);

    // Panel body
    const panel = document.createElement('div');
    panel.className = 'accordion-item-panel';
    if (contentCell) {
      while (contentCell.firstChild) panel.append(contentCell.firstChild);
    }
    details.append(panel);

    row.replaceWith(details);
  });
}
