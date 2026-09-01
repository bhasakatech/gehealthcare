import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Reads the three authored cells (title, link, parent) from a block row.
 * @param {Element} row The authored row element
 * @returns {{ title: string, link: string, parent: string, cell: Element }}
 */
function parseRow(row) {
  const cells = [...row.children];
  const title = cells[0]?.textContent.trim() || '';
  const link = cells[1]?.textContent.trim() || '';
  const parent = cells[2]?.textContent.trim() || '';
  return {
    title, link, parent, cell: cells[0],
  };
}

/**
 * Creates a single <li><a> navigation entry.
 * @param {object} item Parsed row data
 * @returns {Element} The list item element
 */
function createNavItem(item) {
  const li = document.createElement('li');
  li.className = 'section-nav-item';
  const a = document.createElement('a');
  a.className = 'section-nav-link';
  a.href = item.link || '#';
  a.textContent = item.title;
  // relocate authoring instrumentation from the title cell onto the link
  if (item.cell) moveInstrumentation(item.cell, a);
  li.append(a);
  return li;
}

/**
 * Smoothly scrolls to an in-page anchor target.
 * @param {string} hash The anchor hash (e.g. #logo-versions)
 * @returns {boolean} true if a target existed and was scrolled to
 */
function scrollToAnchor(hash) {
  const id = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(id)
    || document.querySelector(`[name="${CSS.escape(id)}"]`);
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

/**
 * Sets up an IntersectionObserver scrollspy that marks the anchor link whose
 * target is currently in view with aria-current="true".
 * @param {Map<string, Element>} anchorLinks Map of element id -> anchor link
 */
function setupScrollSpy(anchorLinks) {
  const targets = [];
  anchorLinks.forEach((link, id) => {
    const target = document.getElementById(id)
      || document.querySelector(`[name="${CSS.escape(id)}"]`);
    if (target) targets.push(target);
  });
  if (!targets.length) return;

  const visible = new Set();

  const setActive = (id) => {
    anchorLinks.forEach((link, key) => {
      if (key === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const { id } = entry.target;
      if (entry.isIntersecting) visible.add(id);
      else visible.delete(id);
    });
    // pick the first target (in document order) that is currently visible
    const active = targets.find((t) => visible.has(t.id));
    if (active) setActive(active.id);
  }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });

  targets.forEach((t) => observer.observe(t));
}

/**
 * loads and decorates the section navigation
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const items = [...block.children].map(parseRow).filter((item) => item.title);

  const nav = document.createElement('nav');
  nav.className = 'section-nav-menu';
  nav.setAttribute('aria-label', 'Section navigation');

  const rootList = document.createElement('ul');
  rootList.className = 'section-nav-list';

  const groups = new Map(); // parent label -> nested <ul>
  const topLevel = new Map(); // label -> <li> (for attaching children)
  const anchorLinks = new Map(); // target id -> anchor link element

  const registerAnchor = (link) => {
    if (link.getAttribute('href')?.startsWith('#')) {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      anchorLinks.set(id, link);
      link.addEventListener('click', (e) => {
        if (scrollToAnchor(link.getAttribute('href'))) e.preventDefault();
      });
    }
  };

  // first pass: create top-level items
  items.filter((item) => !item.parent).forEach((item) => {
    const li = createNavItem(item);
    topLevel.set(item.title, li);
    registerAnchor(li.querySelector('a'));
    rootList.append(li);
  });

  // second pass: nest children under their parent
  items.filter((item) => item.parent).forEach((item) => {
    const parentLi = topLevel.get(item.parent);
    const li = createNavItem(item);
    registerAnchor(li.querySelector('a'));
    if (parentLi) {
      let nested = groups.get(item.parent);
      if (!nested) {
        nested = document.createElement('ul');
        nested.className = 'section-nav-sublist';
        parentLi.classList.add('section-nav-item-parent');
        parentLi.append(nested);
        groups.set(item.parent, nested);
      }
      nested.append(li);
    } else {
      // orphaned child with no matching parent: treat as top level
      rootList.append(li);
    }
  });

  nav.append(rootList);

  // Build the mobile collapsible wrapper. Content lives inside <details>.
  const details = document.createElement('details');
  details.className = 'section-nav-collapsible';
  const summary = document.createElement('summary');
  summary.className = 'section-nav-summary';
  summary.textContent = 'On this page';
  details.append(summary, nav);

  block.replaceChildren(details);

  setupScrollSpy(anchorLinks);
}
