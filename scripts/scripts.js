import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Groups the flat "On <color>, text should be …" accessibility entries on the
 * Color page into a `color-swatches` block so they render as colored contrast
 * cards (matching the live brand hub). The imported content is flat default
 * content — a swatch heading followed by its AA/AAA pass paragraphs — so we
 * find each contiguous run of such headings and wrap it in one block in place.
 * Colors, card styling and layout all live in blocks/color-swatches/.
 * @param {Element} main The container element
 */
function buildColorSwatches(main) {
  const isSwatchHeading = (el) => el && /^H[1-6]$/.test(el.tagName)
    && /^On .+text\s+should\s+be/i.test(el.textContent.trim());
  const isPassLabel = (el) => el && el.tagName === 'P'
    && /pass|normal text|large text/i.test(el.textContent);

  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter(isSwatchHeading);
  if (!headings.length) return;

  // Collect a heading + its following pass-label paragraphs as one card cell.
  const groupOf = (heading) => {
    const nodes = [heading];
    let next = heading.nextElementSibling;
    while (isPassLabel(next)) {
      nodes.push(next);
      next = next.nextElementSibling;
    }
    return { nodes, end: next };
  };

  const handled = new Set();
  headings.forEach((heading) => {
    if (handled.has(heading)) return;

    // Build a contiguous run: consecutive swatch groups with nothing (no
    // caption) between them share one grid.
    const rows = [];
    let cursor = heading;
    while (isSwatchHeading(cursor) && !handled.has(cursor)) {
      handled.add(cursor);
      const { nodes, end } = groupOf(cursor);
      rows.push(nodes);
      cursor = end;
    }

    // Capture the insertion point before building — buildBlock() moves the
    // heading/label nodes into the new block, so the run's own nodes can't be
    // used as an anchor afterwards. `cursor` is the first element after the run
    // (or null at end of parent), which stays put.
    const parent = heading.parentElement;
    const anchor = cursor && cursor.parentElement === parent ? cursor : null;
    const block = buildBlock('color-swatches', rows.map((nodes) => [{ elems: nodes }]));
    parent.insertBefore(block, anchor);
  });
}

// Color page example-image galleries. The import captured only the first image
// of each grid; this maps each seed filename to the full ordered set of members
// (as they appear on the live page) plus the desktop column count.
const COLOR_GALLERIES = [
  {
    seed: 'ge-healthcare-primary-color-usage-example1-1-scaled.jpg',
    cols: 2,
    members: Array.from({ length: 8 }, (_, i) => `ge-healthcare-primary-color-usage-example${i + 1}-1-scaled.jpg`),
  },
  {
    seed: 'ge-healthcare-primary-color-usage-example9-1-1-scaled.jpg',
    cols: 2,
    members: [
      'ge-healthcare-primary-color-usage-example9-1-1-scaled.jpg',
      'ge-healthcare-primary-color-usage-example16-1-scaled.jpg',
      'ge-healthcare-primary-color-usage-example17-1-scaled.jpg',
    ],
  },
  {
    seed: 'ge-healthcare-balance-contrast1-scaled.jpg',
    cols: 2,
    members: ['ge-healthcare-balance-contrast1-scaled.jpg', 'ge-healthcare-balance-contrast2-scaled.jpg', 'ge-healthcare-balance-contrast3-scaled.jpg'],
  },
  {
    seed: 'ge-healthcare-balance-contrast4-scaled.jpg',
    cols: 2,
    members: ['ge-healthcare-balance-contrast4-scaled.jpg', 'ge-healthcare-balance-contrast5-scaled.jpg', 'ge-healthcare-balance-contrast6-scaled.jpg'],
  },
  {
    seed: 'ge-healthcare-primary-color-ratio-usage-1-scaled.jpg',
    cols: 2,
    members: Array.from({ length: 3 }, (_, i) => `ge-healthcare-primary-color-ratio-usage-${i + 1}-scaled.jpg`),
  },
  {
    seed: 'ge-healthcare-primary-color-accent-ratio-usage-1-scaled.jpg',
    cols: 2,
    members: Array.from({ length: 3 }, (_, i) => `ge-healthcare-primary-color-accent-ratio-usage-${i + 1}-scaled.jpg`),
  },
  {
    seed: 'ge-healthcare-primary-accent-hint-ratio-usage-1-scaled.jpg',
    cols: 2,
    members: Array.from({ length: 3 }, (_, i) => `ge-healthcare-primary-accent-hint-ratio-usage-${i + 1}-scaled.jpg`),
  },
];

const ASSET_BASE = '/content/dam/gehealthcare/assets/';

// Builds a `color-gallery` block element from a list of image filenames.
function makeColorGallery(members, cols) {
  const rows = members.map((name) => {
    const pic = document.createElement('picture');
    const el = document.createElement('img');
    el.src = `${ASSET_BASE}${name}`;
    el.alt = '';
    pic.append(el);
    return [{ elems: [pic] }];
  });
  const block = buildBlock('color-gallery', rows);
  block.dataset.cols = String(cols);
  return block;
}

const usageExamples = (from, to) => Array.from(
  { length: to - from + 1 },
  (_, i) => `ge-healthcare-primary-color-usage-example${from + i}-1-scaled.jpg`,
);

/**
 * Rebuilds the "Interactivity / Building hierarchy / Categorization" region of
 * the Color page's accent-usage section. The import mangled this stretch: the
 * "Interactivity" caption survived as a bare paragraph, the "Building hierarchy"
 * caption got glued to example9's image in a single-image content-media block,
 * and the "Categorization" caption + its grid were dropped entirely. This
 * reconstructs all three galleries (example9; 10–11; 12–15) in place, keyed off
 * the surviving "Interactivity" / "Building hierarchy" caption text.
 * @param {Element} main The container element
 */
function buildAccentUsageRegion(main) {
  // Find the "Building hierarchy …" content-media seed (carries example9).
  const seed = [...main.querySelectorAll('.content-media')].find((b) => {
    const img = b.querySelector('img');
    return img && (img.getAttribute('src') || '').includes('primary-color-usage-example9-1-scaled');
  });
  if (!seed) return;

  // The "Interactivity" caption is the paragraph immediately before the seed.
  const interCaption = [...main.querySelectorAll('p')]
    .find((p) => /^Interactivity:/i.test(p.textContent.trim()));

  // Interactivity → single image (example9).
  if (interCaption) {
    interCaption.after(makeColorGallery(usageExamples(9, 9), 1));
  }

  // Building hierarchy → example10–11. Reuse the seed's own caption text as a
  // paragraph, then the 2-up grid, replacing the mis-paired seed block. Take
  // only the first cell's text (the caption); later cells hold the image and
  // the "text-left" layout hint, which must not leak into the caption.
  const hierText = (seed.querySelector(':scope > div > div')?.textContent || '').trim();
  const frag = document.createDocumentFragment();
  if (hierText) {
    const p = document.createElement('p');
    p.textContent = hierText;
    frag.append(p);
  }
  frag.append(makeColorGallery(usageExamples(10, 11), 2));

  // Categorization → caption + example12–15 (dropped at import; re-add here).
  const catP = document.createElement('p');
  catP.textContent = 'Categorization: Accent color can be used to categorize and separate information for data and charts.';
  frag.append(catP);
  frag.append(makeColorGallery(usageExamples(12, 15), 2));

  seed.replaceWith(frag);
}

/**
 * Rebuilds the truncated example-image grids on the Color page. Each grid was
 * imported as a single-image `content-media` block; this finds those seed
 * blocks by their image filename and swaps them for a `color-gallery` block
 * holding the full set of images (see COLOR_GALLERIES). Layout lives in
 * blocks/color-gallery/.
 * @param {Element} main The container element
 */
function buildColorGalleries(main) {
  main.querySelectorAll('.content-media').forEach((seedBlock) => {
    const img = seedBlock.querySelector('img');
    if (!img) return;
    const file = (img.getAttribute('src') || '').split('/').pop();
    const gallery = COLOR_GALLERIES.find((g) => g.seed === file);
    if (!gallery) return;
    seedBlock.replaceWith(makeColorGallery(gallery.members, gallery.cols));
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildColorSwatches(main);
    buildAccentUsageRegion(main);
    buildColorGalleries(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
