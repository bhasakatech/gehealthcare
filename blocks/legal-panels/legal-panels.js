import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Legal Panels — the sectioned layout for the Legal page, mirroring the live
 * brand-hub design.
 *
 * Authored as repeatable "Legal Panel" rows (see _legal-panels.json). Each row
 * is one panel with these authored fields, in order:
 *   [content, mediaLayout, images]
 * - content    : rich text — the sub-section heading (H3) plus paragraphs/lists.
 * - mediaLayout: how the images render — "grid" (two side by side + one full
 *                width below), "half" (single, left, 50%), "beside" (image to
 *                the left of the purple card), or "" (no images).
 * - images     : a multi-image reference field — the authorable panel images.
 *
 * Each panel is classified by its heading to match the live variants:
 *   - `legal-panel-grey`   — light-grey rounded card (Vendors, Co-branding,
 *                            Partnerships, Double-check, Testimonials,
 *                            Endorsements)
 *   - `legal-panel-purple` — solid purple, white-text card (Best practice tips)
 *   - plain                — no card; a divider rule separates it from the next
 * "Dos" / "Don'ts" lists get green-check / red-cross markers.
 *
 * @param {Element} block
 */

// Headings that render as a light-grey rounded card on the live page.
const GREY_PANELS = new Set([
  'vendors and suppliers',
  'co-branding',
  'partnerships, sponsorships and jvs',
  'double- and triple-check the following:',
  'testimonials',
  'endorsements',
]);

// Top-level section headings (rendered largest on the live page, ~48px).
const SECTION_PANELS = new Set([
  'trademark usage and legal considerations',
  'actions requiring approval',
  'video and motion requirements',
  'testimonial disclaimers and endorsements',
  'patient data and consent forms',
]);

// Nested sub-headings (rendered smallest on the live page, ~24px).
const SUB_PANELS = new Set([
  'testimonials',
  'endorsements',
]);

const LAYOUTS = new Set(['grid', 'half', 'beside']);

/**
 * Normalize a heading string for matching against the sets above.
 */
function normalizeLabel(text) {
  return (text || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero-width / BOM chars
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "'"); // normalize curly apostrophes
}

/**
 * Collect authored images from the panel's images cell (the multi-image
 * reference field). Returns an array of optimized `<picture>` elements
 * (instrumentation preserved so they stay editable in Universal Editor).
 */
function collectImages(imagesCell) {
  if (!imagesCell) return [];
  return [...imagesCell.querySelectorAll('img')].map((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    return optimized;
  });
}

export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'legal-panels-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const contentCell = cells[0];
    const layoutRaw = (cells[1]?.textContent || '').trim().toLowerCase();
    const layout = LAYOUTS.has(layoutRaw) ? layoutRaw : '';
    const pictures = collectImages(cells[2]);

    const panel = document.createElement('div');
    panel.className = 'legal-panel';
    moveInstrumentation(row, panel);
    if (contentCell) {
      while (contentCell.firstChild) panel.append(contentCell.firstChild);
    }

    const heading = panel.querySelector('h1, h2, h3, h4, h5, h6');
    const label = normalizeLabel(heading?.textContent);

    // Panel variant by heading.
    if (label === 'best practice tips') panel.classList.add('legal-panel-purple');
    else if (GREY_PANELS.has(label)) panel.classList.add('legal-panel-grey');
    else panel.classList.add('legal-panel-plain');

    // Heading size tier (matches the live type scale): top-level section
    // headings render largest, nested sub-headings smallest, the rest medium.
    if (SECTION_PANELS.has(label)) panel.classList.add('legal-panel-section');
    else if (SUB_PANELS.has(label)) panel.classList.add('legal-panel-sub');

    // Tag a Dos / Don'ts list so its items get check / cross markers.
    let markerFor = null;
    if (label === 'dos') markerFor = 'do';
    else if (label === "don'ts" || label === 'donts') markerFor = 'dont';
    if (markerFor) {
      const list = panel.querySelector('ul');
      if (list) list.classList.add('legal-list', `legal-list-${markerFor}`);
    }

    // "beside" layout: the first authored image sits to the LEFT of this panel
    // (used for the purple "Best practice tips" card). Wrap the image + panel
    // in a two-column row.
    if (layout === 'beside' && pictures.length) {
      const bpRow = document.createElement('div');
      bpRow.className = 'legal-bestpractice-row';
      bpRow.append(pictures[0]);
      bpRow.append(panel);
      container.append(bpRow);
      return;
    }

    // "grid" / "half": append the authored images as a media group in the panel.
    if (layout && pictures.length) {
      const group = document.createElement('div');
      group.className = `legal-panel-media legal-panel-media-${layout}`;
      pictures.forEach((pic) => group.append(pic));
      panel.append(group);
    }

    container.append(panel);
  });

  block.replaceChildren(container);
}
