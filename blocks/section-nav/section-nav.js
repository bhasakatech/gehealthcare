/**
 * Section Nav — the brand hub sidebar navigation.
 *
 * NOTE: All decoration logic is temporarily commented out so that Universal
 * Editor can read the instrumented source rows (data-aue-* attributes) and
 * surface the dialog fields (Title / Link / Parent) for each Section Nav Item.
 *
 * The rows must NOT be hidden (display:none) while diagnosing UE dialog issues,
 * because UE needs them to be in the visible DOM to resolve instrumentation.
 *
 * @param {Element} block
 */

/* ─── Helper functions (commented out for UE dialog debugging) ──────────────

function parseRow(row) {
  const cells = [...row.children];
  return {
    title: cells[0]?.textContent.trim() || '',
    link: cells[1]?.textContent.trim() || '',
    parent: cells[2]?.textContent.trim() || '',
    row,
    cell: cells[0],
  };
}

function resolveHref(href, prefix) {
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('#')
    || href.startsWith('/assets') || (prefix && href.startsWith(prefix))) return href;

  const hashIdx = href.indexOf('#');
  const rawPath = hashIdx === -1 ? href : href.slice(0, hashIdx);
  const hash = hashIdx === -1 ? '' : href.slice(hashIdx);
  const path = rawPath.length > 1 ? rawPath.replace(/\/$/, '') : rawPath;
  return prefix + path + hash;
}

function copyInstrumentation(from, to) {
  [...from.attributes]
    .map(({ nodeName }) => nodeName)
    .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'))
    .forEach((attr) => {
      const value = from.getAttribute(attr);
      if (value) to.setAttribute(attr, value);
    });
}

function createLink(item, prefix) {
  const a = document.createElement('a');
  a.className = 'section-nav-link';
  a.href = resolveHref(item.link || '#', prefix);
  a.textContent = item.title;
  if (item.cell) copyInstrumentation(item.cell, a);
  return a;
}

function createItem(item, prefix) {
  const li = document.createElement('li');
  li.className = 'section-nav-item';
  if (item.row) copyInstrumentation(item.row, li);
  const link = createLink(item, prefix);
  li.append(link);
  return li;
}

function scrollToAnchor(hash) {
  const id = decodeURIComponent((hash || '').slice(1));
  const target = document.getElementById(id)
    || document.querySelector(`[name="${CSS.escape(id)}"]`);
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

function groupMediaCards(content) {
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
    const lis = block.querySelectorAll(':scope > ul > li');
    if (lis.length) return lis.length;
    return block.querySelectorAll(':scope > div').length;
  };

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
      buildGrid(el, members, Math.min(tiles, 3));
      i = j;
      // eslint-disable-next-line no-continue
      continue;
    }

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

function segmentToLabel(segment) {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function buildBreadcrumb(items, normalisePath, prefix) {
  const here = normalisePath(window.location.pathname);
  const segments = here.split('/').filter((s) => s.length);
  if (segments.length === 0) return null;

  const labelByPath = {};
  items.forEach((item) => {
    if (!item.link || item.link.includes('#')) return;
    const p = normalisePath(item.link);
    if (p && p !== '/' && !labelByPath[p]) labelByPath[p] = item.title;
  });

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'section-nav-breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');

  let path = '';
  segments.forEach((segment, i) => {
    path += `/${segment}`;
    const label = labelByPath[path] || segmentToLabel(segment);
    const li = document.createElement('li');
    if (i === segments.length - 1) {
      li.textContent = label;
      li.setAttribute('aria-current', 'page');
    } else {
      const a = document.createElement('a');
      a.href = prefix + path;
      a.textContent = label;
      li.append(a);
    }
    ol.append(li);
  });
  breadcrumb.append(ol);
  return breadcrumb;
}

─── End of commented-out helpers ─────────────────────────────────────────── */

/**
 * Minimal decorate stub — keeps all source rows visible in the DOM so
 * Universal Editor's instrumentation (data-aue-*) attributes can be resolved
 * and the Section Nav Item dialog fields (Title / Link / Parent) are shown.
 *
 *
 * @param {Element} block
 */
// eslint-disable-next-line no-unused-vars
export default async function decorate(block) {
  // Intentionally left minimal so UE can surface the dialog fields.
  // The original rows remain visible (NOT hidden) so data-aue-* attributes
  // are accessible in the live DOM.
  //
  // Full decoration logic is commented out above — restore it once the dialog
  // is confirmed to be working correctly in Universal Editor.
}
