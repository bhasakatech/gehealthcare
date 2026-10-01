import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  const text = cell?.textContent.trim() || '';

  const heading = document.createElement('h2');
  heading.className = 'simple-title-heading';
  heading.textContent = text;
  if (cell) moveInstrumentation(cell, heading);

  block.replaceChildren(heading);
}
