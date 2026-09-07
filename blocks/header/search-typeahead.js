/**
 * Header search typeahead — a dropdown that appears as you type in the header
 * search box, mirroring the live Brand Hub:
 *   - "Suggested Keywords": matching title-derived phrases (submit as a query)
 *   - "Quick Links": matching pages/sections, tagged Page or by parent section,
 *     linking straight to the destination.
 *
 * Data comes from /search-suggestions.json (built by
 * tools/importer/build-search-suggestions.py). Fails silently to a plain search
 * box if the feed is missing.
 */

const FEED = '/search-suggestions.json';
const MAX_KEYWORDS = 7;
const MAX_LINKS = 6;

let cache = null;

async function loadFeed() {
  if (cache) return cache;
  try {
    const resp = await fetch(FEED);
    if (!resp.ok) return { keywords: [], quicklinks: [] };
    const json = await resp.json();
    cache = {
      keywords: json.keywords?.data?.map((k) => k.keyword) || [],
      quicklinks: json.quicklinks?.data || [],
    };
  } catch (e) {
    cache = { keywords: [], quicklinks: [] };
  }
  return cache;
}

// Resolve authored production paths to the current environment (preview serves
// under /content). Anchors and external links pass through.
function resolveHref(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const prefix = window.location.pathname.startsWith('/content/') ? '/content' : '';
  return prefix + href;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlight(text, term) {
  const safe = escapeHTML(text);
  if (!term) return safe;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${esc})`, 'gi'), '<strong>$1</strong>');
}

export default function attachSearchTypeahead(form) {
  const input = form.querySelector('input[type="search"]');
  if (!input) return;
  const action = form.getAttribute('action') || '/search';

  const panel = document.createElement('div');
  panel.className = 'nav-search-suggest';
  panel.hidden = true;
  form.append(panel);

  const close = () => { panel.hidden = true; panel.innerHTML = ''; };

  const render = (term, data) => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) { close(); return; }

    const keywords = data.keywords
      .filter((k) => k.toLowerCase().includes(q))
      .slice(0, MAX_KEYWORDS);
    const links = data.quicklinks
      .filter((l) => l.title.toLowerCase().includes(q))
      .slice(0, MAX_LINKS);

    if (!keywords.length && !links.length) { close(); return; }

    let html = '';
    if (keywords.length) {
      html += '<div class="nav-suggest-group"><p class="nav-suggest-title">Suggested Keywords</p>';
      keywords.forEach((k) => {
        html += `<a class="nav-suggest-keyword" href="${action}?q=${encodeURIComponent(k)}">${highlight(k, term.trim())}</a>`;
      });
      html += '</div>';
    }
    if (links.length) {
      html += '<div class="nav-suggest-group"><p class="nav-suggest-title">Quick Links</p>';
      links.forEach((l) => {
        html += `<a class="nav-suggest-link" href="${resolveHref(l.link)}">`
          + `<span class="nav-suggest-kind">${escapeHTML(l.type)}</span>`
          + `<span class="nav-suggest-label">${highlight(l.title, term.trim())}</span></a>`;
      });
      html += '</div>';
    }
    panel.innerHTML = html;
    panel.hidden = false;
  };

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const data = await loadFeed();
      render(input.value, data);
    }, 120);
  });

  input.addEventListener('focus', async () => {
    if (input.value.trim().length >= 2) render(input.value, await loadFeed());
  });

  // Close on outside click or Escape.
  document.addEventListener('click', (e) => { if (!form.contains(e.target)) close(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
