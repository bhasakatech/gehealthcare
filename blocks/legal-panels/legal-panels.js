/**
 * Legal Panels — the sectioned layout for the Legal page, mirroring the live
 * brand-hub design.
 *
 * Authored as repeatable "Legal Panel" rows (see _legal-panels.json). Each row
 * is one panel: a single rich-text cell holding that sub-section's heading (H3)
 * plus its paragraphs/lists. Each panel is classified by its heading to match
 * the live variants:
 *   - `legal-panel-grey`   — light-grey rounded card (Vendors, Co-branding,
 *                            Partnerships, Double-check, Testimonials,
 *                            Endorsements)
 *   - `legal-panel-purple` — solid purple, white-text card (Best practice tips)
 *   - plain                — no card; a divider rule separates it from the next
 *                            (Trademark, Approval, Video, Patient data, etc.)
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

export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'legal-panels-list';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;

    const panel = document.createElement('div');
    panel.className = 'legal-panel';
    while (cell.firstChild) panel.append(cell.firstChild);

    const heading = panel.querySelector('h1, h2, h3, h4, h5, h6');
    const label = (heading?.textContent || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero-width / BOM chars
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[‘’']/g, "'"); // normalize curly apostrophes

    // Panel variant by heading.
    if (label === 'best practice tips') panel.classList.add('legal-panel-purple');
    else if (GREY_PANELS.has(label)) panel.classList.add('legal-panel-grey');
    else panel.classList.add('legal-panel-plain');

    // Tag a Dos / Don'ts list so its items get check / cross markers.
    let markerFor = null;
    if (label === 'dos') markerFor = 'do';
    else if (label === "don'ts" || label === 'donts') markerFor = 'dont';
    if (markerFor) {
      const list = panel.querySelector('ul');
      if (list) list.classList.add('legal-list', `legal-list-${markerFor}`);
    }

    container.append(panel);
  });

  block.replaceChildren(container);
}
