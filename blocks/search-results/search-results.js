import { decorateIcons } from '../../scripts/aem.js';

const INITIAL_VISIBLE = 6;

// Maps a page path to a display category, mirroring the source site's grouping.
const CATEGORY_RULES = [
  { test: /^\/brand-foundations(\/|$)/, label: 'Brand foundations' },
  { test: /^\/guidelines(\/|$)/, label: 'Guidelines' },
  { test: /^\/downloads(\/|$)/, label: 'Downloads' },
  { test: /^\/learn(\/|$)/, label: 'Training and learning' },
  { test: /^\/legal(\/|$)/, label: 'Legal' },
  { test: /^\/our-brand(\/|$)/, label: 'Our brand' },
  { test: /\.(pdf|zip|pptx?|docx?)$/i, label: 'Downloads' },
];
const DEFAULT_CATEGORY = 'Pages and sections';
// Preferred display order of the category groups.
const CATEGORY_ORDER = [
  'Pages and sections', 'Our brand', 'Brand foundations',
  'Downloads', 'Guidelines', 'Training and learning', 'Legal',
];

// Maps an asset feed `category` value to its display group.
const ASSET_CATEGORY = {
  download: 'Downloads',
  guideline: 'Guidelines',
  training: 'Training and learning',
};

// Rows we never want to surface as search results.
const EXCLUDE_PATHS = /^\/(nav|footer|drafts\/|faq-items|search)/;

function getCategory(row) {
  // Asset rows carry an explicit category; page rows are grouped by path.
  if (row.asset) return ASSET_CATEGORY[row.category] || DEFAULT_CATEGORY;
  const rule = CATEGORY_RULES.find((r) => r.test.test(row.path || ''));
  return rule ? rule.label : DEFAULT_CATEGORY;
}

function titleFromPath(path) {
  const last = path.replace(/\/$/, '').split('/').pop() || 'Home';
  return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Escape a string for safe insertion as text / regex.
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Wrap each matched term in <strong>, operating on already-escaped text.
function highlight(text, terms) {
  const safe = escapeHTML(text);
  if (!terms.length) return safe;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  return safe.replace(pattern, '<strong>$1</strong>');
}

function scoreRow(row, terms) {
  const title = (row.title || '').toLowerCase();
  const desc = (row.description || '').toLowerCase();
  const path = (row.path || '').toLowerCase();
  let score = 0;
  terms.forEach((term) => {
    if (title.includes(term)) score += 3;
    if (desc.includes(term)) score += 1;
    if (path.includes(term)) score += 1;
  });
  return score;
}

function renderResultCard(row, terms) {
  const li = document.createElement('li');
  li.className = 'search-results-card';
  if (row.asset) li.classList.add(`search-results-card-${row.category}`);

  const link = document.createElement('a');
  link.className = 'search-results-link';
  link.href = row.asset ? row.url : row.path;

  const title = row.title || titleFromPath(row.path);
  const h3 = document.createElement('h3');
  h3.innerHTML = highlight(title, terms);
  link.append(h3);

  // File-type badge for asset results (ZIP / PDF / VIDEO …), like the source.
  if (row.asset && row.fileType) {
    const badge = document.createElement('span');
    badge.className = 'search-results-filetype';
    badge.textContent = row.fileType;
    h3.append(document.createTextNode(' '));
    link.insertBefore(badge, h3.nextSibling);
  }

  if (row.description) {
    const p = document.createElement('p');
    const trimmed = row.description.length > 160
      ? `${row.description.slice(0, 160).trim()}…`
      : row.description;
    p.innerHTML = highlight(trimmed, terms);
    link.append(p);
  }

  const go = document.createElement('span');
  go.className = 'search-results-go';
  if (row.asset) {
    go.textContent = row.category === 'training' ? 'View' : `Download ${row.fileType || 'file'}`;
  } else {
    go.textContent = 'Go to page';
  }
  link.append(go);

  li.append(link);
  return li;
}

function renderGroup(category, rows, terms) {
  const section = document.createElement('section');
  section.className = 'search-results-group';

  const header = document.createElement('div');
  header.className = 'search-results-group-header';
  header.innerHTML = `<span class="icon icon-search"></span>
    <span class="search-results-group-title">${escapeHTML(category)}</span>
    <span class="search-results-group-count">${rows.length} result${rows.length === 1 ? '' : 's'}</span>`;
  section.append(header);

  const ul = document.createElement('ul');
  ul.className = 'search-results-cards';
  rows.forEach((row, i) => {
    const card = renderResultCard(row, terms);
    if (i >= INITIAL_VISIBLE) card.hidden = true;
    ul.append(card);
  });
  section.append(ul);

  if (rows.length > INITIAL_VISIBLE) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'search-results-showmore';
    toggle.textContent = 'Show more';
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      ul.querySelectorAll('.search-results-card').forEach((card, i) => {
        if (i >= INITIAL_VISIBLE) card.hidden = expanded;
      });
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      toggle.textContent = expanded ? 'Show more' : 'Show less';
    });
    section.append(toggle);
  }

  return section;
}

function groupResults(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const cat = getCategory(row);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(row);
  });
  return [...groups.entries()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
  );
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Read config from authored cells, then clear the block.
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const source = (cells[0]?.textContent.trim()) || '/query-index.json';
  const assetsSource = cells[2] ? (cells[1]?.textContent.trim()) : '';
  const placeholder = (cells[cells.length - 1]?.textContent.trim()) || 'Search…';
  block.textContent = '';

  const params = new URLSearchParams(window.location.search);
  const query = (params.get('q') || params.get('s') || '').trim();

  // On-page search form (pre-filled with the current query).
  const form = document.createElement('form');
  form.className = 'search-results-form';
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.innerHTML = `
    <input type="search" name="q" aria-label="Search" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(query)}">
    <button type="submit" aria-label="Search"><span class="icon icon-search"></span></button>`;
  block.append(form);
  decorateIcons(form);

  const heading = document.createElement('h1');
  heading.className = 'search-results-heading';
  block.append(heading);

  const output = document.createElement('div');
  output.className = 'search-results-output';
  block.append(output);

  if (!query) {
    heading.textContent = 'Search';
    output.innerHTML = '<p class="search-results-empty">Enter a term above to search the Brand Hub.</p>';
    return;
  }

  heading.innerHTML = `Search results for “${escapeHTML(query)}”`;

  // Fetch pages and assets in parallel; a missing/failed asset feed just means
  // page-only results, never a broken page.
  const fetchData = async (url) => {
    if (!url) return [];
    try {
      const resp = await fetch(url);
      if (!resp.ok) return [];
      const json = await resp.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      return [];
    }
  };

  const [pages, assets] = await Promise.all([
    fetchData(source),
    fetchData(assetsSource),
  ]);

  const pageRows = pages
    .filter((row) => row.path && !EXCLUDE_PATHS.test(row.path) && row.robots !== 'noindex');
  // Tag asset rows so grouping/rendering can treat them as external files.
  const assetRows = assets.map((row) => ({ ...row, asset: true }));

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = [...pageRows, ...assetRows]
    .map((row) => ({ row, score: scoreRow(row, terms) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((m) => m.row);

  if (!matches.length) {
    output.innerHTML = `<p class="search-results-empty">No results found for “${escapeHTML(query)}”. Try a different term.</p>`;
    return;
  }

  groupResults(matches).forEach(([category, rows]) => {
    output.append(renderGroup(category, rows, terms));
  });
  decorateIcons(output);
}
