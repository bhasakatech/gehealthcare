import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Section Nav — the brand hub sidebar navigation.
 *
 * A reusable, multi-level, click-to-expand accordion sidebar. Authored as
 * repeatable "Section Nav Item" rows (see _section-nav.json), each carrying:
 *   [title, link, parent]
 * where `parent` is the title of the item this row nests under (empty = top
 * level). Nesting can be arbitrary depth (a child can itself be a parent).
 *
 * Behaviour mirrors the live site sidebar:
 *   - items with children show a caret; clicking it expands/collapses
 *   - the current page's branch is expanded by default
 *   - in-page anchor links (#..) scroll smoothly and highlight via scrollspy
 *
 * The "For support" contact card is a separate, reusable Support Card block
 * placed beneath this one in the sidebar.
 *
 * @param {Element} block
 */
function parseRow(row) {
  const cells = [...row.children];
  return {
    title: cells[0]?.textContent.trim() || '',
    link: cells[1]?.textContent.trim() || '',
    parent: cells[2]?.textContent.trim() || '',
    cell: cells[0],
  };
}

/**
 * Resolve an authored link to the environment the page is served from.
 * Authored links use production paths (e.g. "/our-brand/"). In a preview that
 * serves pages under a "/content" prefix, those need the prefix added (and the
 * trailing slash removed, since only the extension-less path resolves there).
 * In production `prefix` is empty and links are returned unchanged.
 */
function resolveHref(href, prefix) {
  if (!prefix || !href.startsWith('/') || href.startsWith('//')
    || href.startsWith(prefix) || href.startsWith('/assets')) return href;
  const hashIdx = href.indexOf('#');
  const path = (hashIdx === -1 ? href : href.slice(0, hashIdx)).replace(/\/$/, '');
  const hash = hashIdx === -1 ? '' : href.slice(hashIdx);
  return prefix + path + hash;
}

function createLink(item, prefix) {
  const a = document.createElement('a');
  a.className = 'section-nav-link';
  a.href = resolveHref(item.link || '#', prefix);
  a.textContent = item.title;
  if (item.cell) moveInstrumentation(item.cell, a);
  return a;
}

function scrollToAnchor(hash) {
  const id = decodeURIComponent((hash || '').slice(1));
  const target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function setupScrollSpy(anchorLinks) {
  const targets = [];
  anchorLinks.forEach((link, id) => {
    const t = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
    if (t) targets.push(t);
  });
  if (!targets.length) return;
  const visible = new Set();
  const setActive = (id) => anchorLinks.forEach((link, key) => {
    if (key === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    const active = targets.find((t) => visible.has(t.id));
    if (active) setActive(active.id);
  }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });
  targets.forEach((t) => observer.observe(t));
}

export default async function decorate(block) {
  const items = [...block.children]
    .map(parseRow)
    .filter((i) => i.title);

  const nav = document.createElement('nav');
  nav.className = 'section-nav-menu';
  nav.setAttribute('aria-label', 'Section navigation');

  const rootList = document.createElement('ul');
  rootList.className = 'section-nav-list';

  const liByTitle = new Map();
  const anchorLinks = new Map();
  // Normalise the current path so preview (/content/our-brand) and production
  // (/our-brand/) resolve the same way when matching authored links.
  const normalisePath = (p) => p.replace(/^\/content/, '').replace(/\/$/, '') || '/';
  const here = normalisePath(window.location.pathname);
  // In a preview that serves pages under "/content", rewrite authored links to
  // that prefix; in production the prefix is empty and links are unchanged.
  const prefix = window.location.pathname.startsWith('/content/') ? '/content' : '';

  // A link is "on this page" when it has a #hash and either starts with '#' or
  // its pathname matches the current page. Those scroll in-page (with
  // scrollspy); everything else navigates normally.
  const registerAnchor = (a) => {
    const href = a.getAttribute('href') || '';
    if (!href.includes('#')) return;
    const hash = href.slice(href.indexOf('#'));
    if (hash.length <= 1) return;

    let samePage = href.startsWith('#');
    if (!samePage) {
      try {
        const url = new URL(href, window.location.origin);
        samePage = normalisePath(url.pathname) === here;
      } catch (e) { /* non-URL href */ }
    }
    if (!samePage) return;

    anchorLinks.set(decodeURIComponent(hash.slice(1)), a);
    a.addEventListener('click', (e) => {
      if (scrollToAnchor(hash)) {
        e.preventDefault();
        window.history.replaceState(null, '', hash);
      }
    });
  };

  // Build in authored order so parents exist before their children.
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'section-nav-item';
    const link = createLink(item, prefix);
    li.append(link);
    registerAnchor(link);
    // Mark the exact page link (no #hash) as current so its branch highlights
    // and auto-expands; child anchors highlight via scrollspy while scrolling.
    const rawHref = link.getAttribute('href') || '';
    if (!rawHref.startsWith('#') && !rawHref.includes('#')) {
      try {
        const linkPath = normalisePath(new URL(link.href, window.location.origin).pathname);
        if (linkPath && linkPath === here) li.classList.add('section-nav-current');
      } catch (e) { /* non-URL href */ }
    }
    liByTitle.set(item.title, li);

    if (item.parent && liByTitle.has(item.parent)) {
      const parentLi = liByTitle.get(item.parent);
      let sub = parentLi.querySelector(':scope > ul.section-nav-sublist');
      if (!sub) {
        sub = document.createElement('ul');
        sub.className = 'section-nav-sublist';
        parentLi.classList.add('section-nav-item-parent');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'section-nav-toggle';
        toggle.setAttribute('aria-label', `Toggle ${item.parent}`);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const open = parentLi.classList.toggle('section-nav-open');
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        parentLi.append(toggle, sub);
      }
      sub.append(li);
    } else {
      rootList.append(li);
    }
  });

  // Expand the branch containing the current page.
  let node = rootList.querySelector('.section-nav-current');
  while (node && node !== rootList) {
    if (node.classList?.contains('section-nav-item-parent')) {
      node.classList.add('section-nav-open');
      const t = node.querySelector(':scope > .section-nav-toggle');
      if (t) t.setAttribute('aria-expanded', 'true');
    }
    node = node.parentElement ? node.parentElement.closest('.section-nav-item') : null;
  }

  nav.append(rootList);

  // Mobile collapsible wrapper (disclosure); desktop shows it always open.
  const details = document.createElement('details');
  details.className = 'section-nav-collapsible';
  const summary = document.createElement('summary');
  summary.className = 'section-nav-summary';
  summary.textContent = 'Menu';
  details.append(summary, nav);

  // A closed <details> hides its content, so on desktop (where the summary is
  // hidden) keep the navigation open regardless of the disclosure state.
  const desktop = window.matchMedia('(min-width: 900px)');
  const syncDisclosure = () => { if (desktop.matches) details.open = true; };
  syncDisclosure();
  desktop.addEventListener('change', syncDisclosure);

  block.replaceChildren(details);
  setupScrollSpy(anchorLinks);

  // Rebuild the sidebar layout as a robust two-column flex row:
  //   .section-nav-wrapper  (sidebar: nav + support card, one sticky unit)
  //   .sidebar-layout-content (everything else, in document order)
  // Grouping the content in its own wrapper guarantees the sidebar stays a
  // single fixed-width flex child pinned to the top — it can't be pushed down
  // by grid auto-placement or tall content rows.
  const wrapper = block.closest('.section-nav-wrapper');
  const section = block.closest('.section');
  if (wrapper && section) {
    const supportWrapper = section.querySelector('.support-card-wrapper');
    // Pull the support card into the sidebar so both scroll together.
    if (supportWrapper && !wrapper.contains(supportWrapper)) {
      wrapper.append(supportWrapper);
    }
    // Wrap all remaining direct children (the page content) in one column,
    // preserving their order.
    if (!section.querySelector(':scope > .sidebar-layout-content')) {
      const content = document.createElement('div');
      content.className = 'sidebar-layout-content';
      [...section.children].forEach((child) => {
        if (child !== wrapper) content.append(child);
      });
      section.append(content);
    }
  }
}
