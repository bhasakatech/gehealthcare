/**
 * Legal Panels — the sectioned card layout for the Legal page.
 *
 * The Legal content is authored as flat default content (an H3 heading
 * followed by its paragraphs/lists, repeated). This block groups each H3 and
 * the content up to the next H3 into a rounded `.legal-panel` card, and:
 *   - tags "Dos" / "Don'ts" lists so their items render with green-check /
 *     red-cross markers (styled in legal-panels.css)
 *   - marks the "Best practice tips" panel as the solid-purple variant
 *
 * Authored markup: a single-cell block whose one cell holds the flat content,
 * e.g.
 *   | Legal Panels |
 *   | <h3>…</h3><p>…</p><ul>…</ul>… |
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // The flat content lives in the block's single inner cell.
  const cell = block.querySelector(':scope > div > div') || block.querySelector(':scope > div') || block;
  const nodes = [...cell.children];

  const container = document.createElement('div');
  container.className = 'legal-panels-list';

  let panel = null;
  let markerFor = null;

  nodes.forEach((node) => {
    if (node.tagName === 'H3') {
      panel = document.createElement('div');
      panel.className = 'legal-panel';
      container.append(panel);
      panel.append(node);

      // Remember whether the next list is a "Dos" or "Don'ts" list so its
      // items render with green-check / red-cross markers like the live page.
      const heading = node.textContent.trim().toLowerCase().replace(/[’']/g, "'");
      if (heading === 'dos') markerFor = 'do';
      else if (heading === "don'ts" || heading === 'donts') markerFor = 'dont';
      else markerFor = null;

      // "Best practice tips" is a solid purple, white-text panel on the live page.
      if (heading === 'best practice tips') panel.classList.add('legal-panel-purple');
    } else if (panel) {
      if (node.tagName === 'UL' && markerFor) {
        node.classList.add('legal-list', `legal-list-${markerFor}`);
        markerFor = null;
      }
      panel.append(node);
    } else {
      // Intro content before the first H3 stays above the panels.
      container.append(node);
    }
  });

  block.replaceChildren(container);
}
