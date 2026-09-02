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
  // Design elements page — "Content placement" example grid (seed = full-image).
  {
    seed: 'ge-healthcare-content-placement-full-image-scaled.jpg',
    cols: 2,
    members: [
      'ge-healthcare-content-placement-full-image-scaled.jpg',
      'ge-healthcare-content-placement-half-image-scaled.jpg',
      'ge-healthcare-content-placement-full-image-graphic-device-outer-margin-scaled.jpg',
      'ge-healthcare-content-placement-half-image-graphic-device-outer-margin-scaled.jpg',
      'gehealthcare-multi-column-text-image-adjacent-to-full-bleed-scaled.jpg',
      'gehealthcare-12-column-layout-complexity-of-content-info-scaled.jpg',
    ],
  },
  // Design elements — "Graphic device usage" example grid (seed = align-outer-margin).
  {
    seed: 'ge-healthcare-graphic-device-align-outer-margin-full-page-scaled.jpg',
    cols: 2,
    members: [
      'ge-healthcare-graphic-device-align-outer-margin-full-page-scaled.jpg',
      'ge-healthcare-graphic-device-align-margin-with-content-scaled.jpg',
      'ge-healthcare-multiple-graphic-devices-aligned-with-columns-scaled.jpg',
    ],
  },
  // Design elements — "Brochure" usage grid (seed = brochure-hero-spread).
  {
    seed: 'ge-healthcare-graphic-device-brochure-hero-spread-scaled.jpg',
    cols: 2,
    members: [
      'ge-healthcare-graphic-device-brochure-hero-spread-scaled.jpg',
      'ge-healthcare-graphic-device-brochure-product-layout-scaled.jpg',
      'ge-healthcare-graphic-device-brochure-image-content-scaled.jpg',
    ],
  },
  // Design elements — "Promotional items" grid (seed = polo-shirt).
  {
    seed: 'ge-healthcare-promotional-items-polo-shirt-scaled.jpg',
    cols: 2,
    members: [
      'ge-healthcare-promotional-items-polo-shirt-scaled.jpg',
      'ge-healthcare-promotional-items-water-bottles-scaled.jpg',
      'ge-healthcare-promotional-items-travel-mug-scaled.jpg',
      'ge-healthcare-promotional-items-hoodie-scaled.jpg',
      'ge-healthcare-promotional-items-quarter-zip-jacket-scaled.jpg',
      'ge-healthcare-promotional-items-backpack-scaled.jpg',
    ],
  },
  // photography
  {
    seed: 'ge-healthcare-home-care-visit-authentic-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-home-care-visit-authentic-scaled.jpg', 'ge-healthcare-manufacturing-workshop-authentic-scaled.jpg'],
  },
  // photography
  {
    seed: 'gehealthcare-patient-human-300x169.jpg',
    cols: 2,
    members: ['gehealthcare-patient-human-scaled.jpg', 'ge-healthcare-clinician-patient-bedside-interaction-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-clinical-staff-patient-walkthrough-hospital-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-clinical-staff-patient-walkthrough-hospital-scaled.jpg', 'ge-healthcare-children-home-kitchen-home-spontaneous-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-patient-clinical-conversation-diversity-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-patient-clinical-conversation-diversity-scaled.jpg', 'ge-healthcare-elderly-care-home-diversity-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-mother-newborn-hospital-patients-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-mother-newborn-hospital-patients-scaled.jpg', 'ge-healthcare-remote-laptop-patients-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-office-team-collaboration-office-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-office-team-collaboration-office-scaled.jpg', 'ge-healthcare-customer-support-call-center-office-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-manufacturing-facility-exterior-building-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-manufacturing-facility-exterior-building-scaled.jpg', 'ge-healthcare-corporate-office-building-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-precision-engineered-component-technology-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-precision-engineered-component-technology-scaled.jpg', 'ge-healthcare-laboratory-automation-equipment-technology-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-mammography-imaging-system-clinical-use-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-mammography-imaging-system-clinical-use-scaled.jpg', 'ge-healthcare-mri-system-exam-room-studio-image-product-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-ultrasound-system-product-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-ultrasound-system-product-scaled.jpg', 'ge-healthcare-ct-scanner-product-scaled.jpg', 'ge-healthcare-clinical-monitor-tablet-interface-scaled.jpg', 'ge-healthcare-Invenia-ABUS-Premium-product-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-leadership-portrait-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-leadership-portrait-scaled.jpg', 'ge-healthcare-executive-portrait-scaled.jpg'],
  },
  // photography
  {
    seed: 'ge-healthcare-team-member-portrait-300x169.jpg',
    cols: 2,
    members: ['ge-healthcare-team-member-portrait-scaled.jpg', 'ge-healthcare-team-member-portrait2-scaled.jpg'],
  },
  // video
  {
    seed: 'gehealthcare-lighting-tone1-300x169.jpg',
    cols: 2,
    members: ['gehealthcare-lighting-tone1-scaled.jpg', 'gehealthcare-lighting-tone2-scaled.jpg', 'gehealthcare-filming-branded-products-scaled.jpg', 'gehealthcare-lighting-tone4-scaled.jpg'],
  },
  // motion
  {
    seed: 'gehealthcare-subtitles-centered-at-the-bottom-300x169.jpg',
    cols: 2,
    members: ['gehealthcare-subtitles-centered-at-the-bottom-scaled.jpg', 'gehealthcare-spect-ratio-safe-areas-scaled.jpg', 'gehealthcare-bottom-centered-subtitles-1-scaled.jpg'],
  },
  // motion
  {
    seed: 'gehealthcare-infographic-and-graphic-overlay-elements-1-1-scaled.jpg',
    cols: 2,
    members: ['gehealthcare-infographic-and-graphic-overlay-elements-1-1-scaled.jpg', 'gehealthcare-infographic-and-graphic-overlay-elements-2-1-scaled.jpg', 'gehealthcare-infographic-and-graphic-overlay-elements-3-1-scaled.jpg'],
  },
  // motion
  {
    seed: 'gehealthcare-on-screen-text-1-1-scaled.jpg',
    cols: 2,
    members: ['gehealthcare-on-screen-text-1-1-scaled.jpg', 'gehealthcare-on-screen-text-2-1-scaled.jpg', 'gehealthcare-on-screen-text-3-1-scaled.jpg', 'gehealthcare-on-screen-text-4-1-scaled.jpg'],
  },
  // typography
  {
    seed: 'ge-healthcare-fonts-calibri-scaled.jpg',
    cols: 2,
    members: ['ge-healthcare-fonts-calibri-scaled.jpg', 'ge-healthcare-fonts-calibri-reg-scaled.jpg', 'ge-healthcare-fonts-calibri-italic-scaled.jpg', 'ge-healthcare-fonts-calibri-bold-scaled.jpg', 'ge-healthcare-fonts-calibri-bold-italic-scaled.jpg'],
  },
  // typography
  {
    seed: 'ge-healthcare-fonts-source-sans-pro-all-scaled.jpg',
    cols: 2,
    members: ['ge-healthcare-fonts-source-sans-pro-all-scaled.jpg', 'ge-healthcare-fonts-source-sans-pro-reg-scaled.jpg', 'ge-healthcare-fonts-source-sans-pro-semi-bold-scaled.jpg', 'ge-healthcare-fonts-source-sans-pro-italic-scaled.jpg', 'ge-healthcare-fonts-source-sans-pro-semi-bold-italic-scaled.jpg', 'ge-healthcare-fonts-source-sans-pro-light-scaled.jpg'],
  },
  // typography
  {
    seed: 'ge-healthcare-Type-hierarchy-1-scaled.jpg',
    cols: 2,
    members: ['ge-healthcare-Type-hierarchy-1-scaled.jpg', 'ge-healthcare-Type-hierarchy-2-scaled.jpg'],
  },
  // typography
  {
    seed: 'ge-healthcare-Type-hierarchy-in-use-special-use1.jpg',
    cols: 2,
    members: ['ge-healthcare-Type-hierarchy-in-use-special-use1.jpg', 'ge-healthcare-Type-hierarchy-in-use-special-use2-scaled.jpg'],
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
 * Rebuilds the Design elements "Layout system" grid section. The import split
 * it into two single-image content-media blocks (6-column and 12-column grid
 * diagrams) with the small Margins/Gutters/Columns thumbnails scattered as
 * bare full-size <picture> paragraphs between them. This collects those pieces
 * and swaps them for one `layout-grid` block: the two diagrams side by side
 * with a labeled thumbnail row beneath (see blocks/layout-grid/).
 * @param {Element} main The container element
 */
function buildLayoutGrid(main) {
  const findGridSeed = (part) => [...main.querySelectorAll('.content-media')].find((b) => {
    const img = b.querySelector('img');
    return img && (img.getAttribute('src') || '').includes(`layout-system-grid-${part}-column-grid`);
  });
  const six = findGridSeed('6');
  const twelve = findGridSeed('12');
  if (!six || !twelve) return;

  const gridImg = (seed) => seed.querySelector('img')?.getAttribute('src');
  // Collect the Margins/Gutters/Columns thumbnails (label paragraph + image
  // paragraph pairs) that sit between the "6-column grid" and "12-column grid"
  // labels in the same default-content wrapper.
  const thumbs = [];
  ['margins', 'gutters', 'columns'].forEach((name) => {
    const img = [...main.querySelectorAll('img')]
      .find((im) => (im.getAttribute('src') || '').includes(`layout-system-grid-${name}`));
    if (!img) return;
    const src = img.getAttribute('src');
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    thumbs.push({ src, label });
    // remove the bare image paragraph + its preceding label paragraph
    const p = img.closest('p');
    const prev = p?.previousElementSibling;
    if (prev && prev.tagName === 'P' && prev.textContent.trim().toLowerCase() === name) prev.remove();
    p?.remove();
  });

  // Build rows: row1 = two diagram cells; row2 = three thumbnail cells.
  const mkImgCell = (src, alt) => {
    const pic = document.createElement('picture');
    const im = document.createElement('img');
    im.src = src; im.alt = alt || '';
    pic.append(im);
    return { elems: [pic] };
  };
  const row1 = [mkImgCell(gridImg(six), '6-column grid'), mkImgCell(gridImg(twelve), '12-column grid')];
  const row2 = thumbs.map((t) => {
    const wrap = document.createElement('div');
    const pic = document.createElement('picture');
    const im = document.createElement('img'); im.src = t.src; im.alt = t.label;
    pic.append(im);
    wrap.append(pic);
    wrap.append(document.createTextNode(t.label));
    return { elems: [wrap] };
  });

  // Remove the stray "6-column grid" / "12-column grid" text labels — they now
  // render inside the block above each diagram.
  [...main.querySelectorAll('strong')].forEach((s) => {
    const t = s.textContent.trim().toLowerCase();
    if (t === '6-column grid' || t === '12-column grid') {
      const wrap = s.closest('p') || s;
      wrap.remove();
    }
  });

  const block = buildBlock('layout-grid', row2.length ? [row1, row2] : [row1]);
  six.replaceWith(block);
  twelve.remove();

  // The "Rounded corner of unit" construction diagram is a square image that
  // should render at a modest size (like live), not full content width. Tag
  // its content-media block so the block CSS can cap it.
  const cornerBlock = [...main.querySelectorAll('.content-media')].find((b) => {
    const im = b.querySelector('img');
    return im && (im.getAttribute('src') || '').includes('graphic-device-rounded-corner-of-unit');
  });
  if (cornerBlock) cornerBlock.classList.add('content-media-compact');
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildColorSwatches(main);
    buildAccentUsageRegion(main);
    buildLayoutGrid(main);
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
