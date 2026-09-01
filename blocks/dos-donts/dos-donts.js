import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MARKERS = {
  do: {
    label: 'Do',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="12" fill="#2e7d32"></circle>
      <path d="M17 8.5l-6.2 6.2L7 11" fill="none" stroke="#fff" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`,
  },
  dont: {
    label: "Don't",
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="12" fill="#d32f2f"></circle>
      <path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#fff" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`,
  },
};

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [statusCell, imageCell, exampleCell, captionCell] = cells;

    const rawStatus = (statusCell?.textContent || '').trim().toLowerCase();
    const status = rawStatus === 'do' ? 'do' : 'dont';
    const marker = MARKERS[status];

    const li = document.createElement('li');
    li.className = `dos-donts-card dos-donts-${status}`;
    moveInstrumentation(row, li);

    // Framed example area (image and/or example richtext)
    const frame = document.createElement('div');
    frame.className = 'dos-donts-frame';

    const picture = imageCell?.querySelector('picture');
    if (picture) {
      const example = document.createElement('div');
      example.className = 'dos-donts-example dos-donts-example-image';
      example.append(picture);
      frame.append(example);
    }

    if (exampleCell && exampleCell.textContent.trim()) {
      const example = document.createElement('div');
      example.className = 'dos-donts-example dos-donts-example-text';
      while (exampleCell.firstChild) example.append(exampleCell.firstChild);
      frame.append(example);
    }

    // Status marker overlaid bottom-left of the frame
    const badge = document.createElement('span');
    badge.className = 'dos-donts-marker';
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', marker.label);
    badge.innerHTML = marker.svg;
    frame.append(badge);

    li.append(frame);

    // Caption under the card
    if (captionCell && captionCell.textContent.trim()) {
      const caption = document.createElement('div');
      caption.className = 'dos-donts-caption';
      while (captionCell.firstChild) caption.append(captionCell.firstChild);
      li.append(caption);
    }

    ul.append(li);
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
}
