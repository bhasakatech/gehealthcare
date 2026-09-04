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
 * Authored links use production paths with a trailing slash (e.g.
 * "/our-brand/"). EDS serves pages at the extension-less path *without* the
 * trailing slash, so the trailing slash must always be stripped — keeping it
 * redirects to a 404. In a preview that serves pages under a "/content"
 * prefix, that prefix is also added. External links, in-page anchors and
 * asset URLs are returned unchanged.
 */
function resolveHref(href, prefix) {
  // Leave external links, protocol-relative links, in-page anchors and assets
  // untouched. Also skip anything already carrying the preview prefix.
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('#')
    || href.startsWith('/assets') || (prefix && href.startsWith(prefix))) return href;

  const hashIdx = href.indexOf('#');
  const rawPath = hashIdx === -1 ? href : href.slice(0, hashIdx);
  const hash = hashIdx === -1 ? '' : href.slice(hashIdx);
  // Strip a trailing slash from the page path (but never reduce root "/" to "").
  const path = rawPath.length > 1 ? rawPath.replace(/\/$/, '') : rawPath;
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

/**
 * Group each section's image "cards" into a responsive grid, matching the
 * multi-column example grids on the live brand-foundation pages (e.g. Logos).
 *
 * On the live page, a section's example tiles flow into 2-up / 3-up grids. In
 * the migrated EDS content each tile is a standalone single-column
 * `content-media` block (the `caption` / `image-only` variants), and the
 * section's descriptive prose was split into separate `default-content-wrapper`
 * blocks interleaved *between* those tiles — so they stack vertically.
 *
 * This regroups per section: a section starts at a heading (h2/h3) and runs
 * until the next heading. Within a section, all image tiles are collected and
 * moved into one `.media-grid-auto` grid, positioned where the first tile was.
 * Text/prose keeps its place; only the image tiles are gathered so they lay out
 * side by side like the live grids. A grid is only created when a section has
 * 2+ tiles, so lone images (and pages without such runs — legal, our-brand,
 * home) are untouched.
 */
function groupMediaCards(content) {
  // Only caption cards flow into the multi-column grid. image-only tiles (the
  // full-width primary logo, platform length banners, placement diagrams) stay
  // full width, matching the live 1/1 rows — so a section like "Logo versions"
  // keeps Horizontal full width above a 2-up of Stacked + Platform.
  //
  // This runs before content-media decorates (section-nav is the first block in
  // the section), so the `.caption` class isn't set yet. Read the authored
  // layout instead: the decorated class if present, else the raw layout cell
  // (the block's last field), which holds the value from the moment it renders.
  const cardLayout = (el) => {
    const cm = el?.querySelector(':scope > .content-media');
    if (!cm) return null;
    const known = ['text-left', 'text-right', 'text-only', 'image-only', 'caption', 'caption-wide'];
    const cls = known.find((l) => cm.classList.contains(l));
    if (cls) return cls;
    const rows = [...cm.children];
    const firstCells = rows[0] ? [...rows[0].children] : [];
    const cells = firstCells.length > 1 ? firstCells : rows.map((r) => r.firstElementChild || r);
    const raw = cells[cells.length - 1]?.textContent.trim();
    return known.includes(raw) ? raw : null;
  };
  const isCard = (el) => el?.classList?.contains('content-media-wrapper')
    && cardLayout(el) === 'caption';
  const isDosDonts = (el) => el?.classList?.contains('dos-donts-wrapper')
    || !!el?.querySelector?.(':scope > .dos-donts');
  const dosDontsCount = (el) => {
    const block = el.querySelector(':scope > .dos-donts') || el;
    // Pre-decoration: each dont is a direct child <div> row; post-decoration:
    // an <li> in the built <ul>. Count whichever is present.
    const lis = block.querySelectorAll(':scope > ul > li');
    if (lis.length) return lis.length;
    return block.querySelectorAll(':scope > div').length;
  };

  // Group tiles into one grid with an explicit column count that matches the
  // live page (auto-fill can't tell a 3-up from a 2-up). `place` is the element
  // the grid is inserted before; `members` are moved into it.
  const buildGrid = (place, members, columns) => {
    const grid = document.createElement('div');
    grid.className = 'media-grid-auto';
    grid.classList.add(`media-grid-${columns}up`);
    content.insertBefore(grid, place);
    members.forEach((m) => grid.append(m));
    return grid;
  };

  const kids = [...content.children];
  let i = 0;
  while (i < kids.length) {
    const el = kids[i];

    // Mixed example row: a caption card immediately followed by one or more
    // dos-donts blocks (the "Logo integrity" / "GE HealthCare name" example
    // rows on live — a good example beside its ✗ don't cards). Merge the good
    // card and each dont card into one equal-column grid. The dos-donts wrapper
    // is flattened (`display: contents`) so its cards become grid columns.
    if (isCard(el) && isDosDonts(kids[i + 1])) {
      const members = [el];
      let tiles = 1;
      let j = i + 1;
      while (isDosDonts(kids[j])) {
        kids[j].classList.add('dos-donts-inline');
        tiles += dosDontsCount(kids[j]);
        members.push(kids[j]);
        j += 1;
      }
      // Cap at 3 columns; more tiles wrap (e.g. 1 good + 4 don'ts → 3 then 2),
      // matching the live 1/3-width columns.
      buildGrid(el, members, Math.min(tiles, 3));
      i = j;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Plain caption grid: a run of 2+ consecutive caption cards (Logo color,
    // Logo versions, placement, …). Exactly three tiles → 3-up; otherwise 2-up
    // (a 6-tile run wraps to three rows of two).
    if (isCard(el)) {
      const run = [];
      let j = i;
      while (isCard(kids[j])) { run.push(kids[j]); j += 1; }
      if (run.length >= 2) {
        buildGrid(run[0], run, run.length === 3 ? 3 : 2);
        i = j;
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    i += 1;
  }
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
      groupMediaCards(content);
    }
  }
}
