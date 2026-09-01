/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for the GE HealthCare Brand Hub (WordPress + Avada/Fusion).
 *
 * Strips WordPress/Avada chrome (site header, footer, nav menus, search overlays,
 * cookie banners, scripts/styles, scroll-to-top widgets) and isolates the page's
 * main content so downstream parsers and the importer only see real content.
 *
 * @param {string} hookName  'beforeTransform' | 'afterTransform'
 * @param {Element} element  root element (document.body)
 * @param {Object} payload   { document, url, html, params }
 */
export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    // Remove non-content elements globally.
    const stripSelectors = [
      'script',
      'style',
      'noscript',
      'link',
      'svg defs',
      'iframe[src*="doubleclick"]',
      // Avada / WordPress chrome
      '.fusion-header-wrapper',
      '.fusion-header',
      '#side-header',
      '.side-header-wrapper',
      'header#masthead',
      '.awb-menu',
      '.fusion-mobile-menu-icons',
      '.fusion-secondary-header',
      '.fusion-flyout-menu-toggle',
      '.fusion-flyout-menu',
      '.search-overlay',
      '.fusion-search-form',
      '.fusion-footer',
      '.fusion-footer-widget-area',
      '.fusion-footer-copyright-area',
      'footer#colophon',
      '#wrapper > footer',
      '.to-top-container',
      '.awb-to-top-container',
      '.fusion-back-to-top',
      // cookie / consent
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
      '#ot-sdk-btn-floating',
      '.cookie-notice',
      '.cmplz-cookiebanner',
      '[id*="cookie"]',
      '[class*="cookie-banner"]',
    ];
    stripSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // Isolate main content: prefer #content, then #main, else leave body.
    const main = document.querySelector('#content')
      || document.querySelector('#main')
      || document.querySelector('main');
    if (main && main !== document.body) {
      // Move main into a clean body so only its subtree survives.
      const body = document.body;
      body.replaceChildren(main);
    }

    // This is a content-first import (no block parsers), so NO classed <div>
    // should reach the output. The Helix importer turns any surviving
    // `<div class="foo">` into a block table named "Foo" — e.g. leftover Avada
    // swatch/timing wrappers became bogus blocks like
    // "Normal Textaa Passaaa Passlarge Text" and "2000 Milliseconds 50 Frames
    // 25 Fps". Strip class attributes from every div so they stay plain
    // structural wrappers, and drop wrappers that are entirely empty.
    const root = document.querySelector('#content')
      || document.querySelector('#main')
      || document.body;
    root.querySelectorAll('div[class]').forEach((div) => div.removeAttribute('class'));

    // Avada uses layout <table>s (e.g. color accessibility swatches like
    // "Normal text / AA Pass / AAA Pass", motion timing grids) that are NOT EDS
    // blocks. The Helix importer turns every <table> into a block named after
    // its first cell, producing bogus components like
    // "Normal Textaa Passaaa Passlarge Text" / "2000 Milliseconds 50 Frames 25
    // Fps". Flatten these tables into plain paragraphs so they import as content.
    root.querySelectorAll('table').forEach((table) => {
      const container = document.createElement('div');
      table.querySelectorAll('td, th').forEach((cell) => {
        const text = cell.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          container.appendChild(p);
        }
        // Preserve any media inside the cell.
        cell.querySelectorAll('img, picture, video, iframe, a').forEach((m) => {
          container.appendChild(m);
        });
      });
      table.replaceWith(container);
    });

    // Remove empty (no text, no media) leftover wrapper divs, innermost first.
    Array.from(root.querySelectorAll('div')).reverse().forEach((div) => {
      const hasMedia = div.querySelector('img, picture, video, iframe, a, svg');
      if (!hasMedia && div.textContent.trim() === '') div.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Final tidy: drop empty Avada wrapper divs and stray anchors/hidden nodes.
    document.querySelectorAll('[style*="display:none"], [style*="display: none"], [aria-hidden="true"].awb-sep')
      .forEach((el) => el.remove());

    // Remove Avada builder helper anchors (e.g. #!/ jump anchors with no content).
    document.querySelectorAll('a[name]:empty, a.fusion-one-page-text-link:empty').forEach((el) => el.remove());

    // GUARD: flatten nested inline markup inside links. Anchors that wrap
    // <u>/<strong>/<em>/<span>/<br> (e.g. "Download the form <u>here</u>") break
    // markdown link serialization and cause package-creation failures. An anchor
    // that wraps ONLY an image is left intact (that's a valid linked image).
    document.querySelectorAll('a').forEach((a) => {
      if (a.querySelector('img, picture, svg')) return; // linked media — keep
      if (a.querySelector('u, strong, em, span, br, b, i, mark, small')) {
        a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      }
    });
  }
}
