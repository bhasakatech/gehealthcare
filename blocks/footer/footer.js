import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Reads the footer's authored model fields from the loaded fragment and rebuilds
 * a clean, semantic footer DOM. The footer is modeled (see _footer.json) with:
 *   - logo (image) + logoAlt + logoLink
 *   - copyright (text) + legalNote (text)
 *   - "Footer Quick Link" items  (text + link)      → quick-links band
 *   - "Footer Policy Link" items (text + link + newTab) → cookies/policy band
 *
 * Rather than trusting fixed row positions, we classify the authored content by
 * field meaning so the footer stays correct even if authors reorder rows.
 *
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  // Collect the authored field values from the fragment.
  const logoImg = fragment.querySelector('picture, img');
  const logoAnchor = logoImg ? logoImg.closest('a') : null;

  // All anchors that are NOT the logo, in author order.
  const anchors = [...fragment.querySelectorAll('a')].filter((a) => a !== logoAnchor && !a.contains(logoImg));

  // Classify links: policy links point off-site (gehealthcare.com / http) or are
  // the cookie "#" trigger; quick links point within the brand hub.
  const isPolicy = (a) => {
    const href = a.getAttribute('href') || '';
    if (href === '#' || /cookie/i.test(a.textContent)) return true;
    try {
      const url = new URL(href, window.location.origin);
      return url.hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  };
  const quickLinks = anchors.filter((a) => !isPolicy(a));
  const policyLinks = anchors.filter(isPolicy);

  // Copyright / legal note: text paragraphs that are not inside a list.
  const textParas = [...fragment.querySelectorAll('p')]
    .filter((p) => !p.closest('ul, nav') && !p.querySelector('picture, img') && p.textContent.trim());

  block.textContent = '';
  const footer = document.createElement('div');

  // --- Band 1: logo + quick links ---
  if (logoImg) {
    const logoRow = document.createElement('div');
    logoRow.className = 'footer-logo';
    const link = document.createElement('a');
    link.href = (logoAnchor && logoAnchor.getAttribute('href')) || '/';
    link.setAttribute('aria-label', 'GE HealthCare');
    link.append(logoImg.closest('picture') || logoImg);
    logoRow.append(link);
    footer.append(logoRow);
  }

  if (quickLinks.length) {
    const navRow = document.createElement('div');
    navRow.className = 'footer-nav';
    const ul = document.createElement('ul');
    quickLinks.forEach((a) => {
      const li = document.createElement('li');
      li.append(a);
      ul.append(li);
    });
    navRow.append(ul);
    footer.append(navRow);
  }

  // --- Band 2: copyright + policy links ---
  if (textParas.length) {
    const copyRow = document.createElement('div');
    copyRow.className = 'footer-copyright';
    textParas.forEach((p) => copyRow.append(p));
    footer.append(copyRow);
  }

  if (policyLinks.length) {
    const legalRow = document.createElement('div');
    legalRow.className = 'footer-legal';
    const ul = document.createElement('ul');
    policyLinks.forEach((a) => {
      const li = document.createElement('li');
      li.append(a);
      ul.append(li);
    });
    legalRow.append(ul);
    footer.append(legalRow);
  }

  block.append(footer);

  // Back-to-top button (matches the source's circular scroll-to-top control).
  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'footer-to-top';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '<span class="footer-to-top-icon"></span>';
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  block.append(toTop);
}
