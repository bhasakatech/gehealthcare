import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import attachSearchTypeahead from './search-typeahead.js';

// Below this width the nav collapses to icons (matches source data-breakpoint=1024).
const isDesktop = window.matchMedia('(min-width: 1024px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    if (expanded && !isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button').focus();
    }
  }
}

/**
 * Toggles the mobile nav drawer (menu links) open/closed.
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Turns a path segment ("brand-foundations") into a readable label
 * ("Brand foundations") for use when the nav has no matching link.
 */
function segmentToLabel(segment) {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds a breadcrumb trail from the current page path. Labels are resolved
 * from the nav menu links when possible, otherwise derived from the path
 * segment. The first item is always a "Home" link and the last item (the
 * current page) is rendered as plain text, matching the live site.
 * @param {Element} menuList the primary nav <ul>, used to look up nice labels
 * @returns {Element|null} a <nav> breadcrumb element, or null on the home page
 */
function buildBreadcrumbs(menuList) {
  const path = window.location.pathname.replace(/\.html$/, '');
  const segments = path.split('/').filter((s) => s.length);
  // No breadcrumbs on the home page.
  if (segments.length === 0) return null;

  // Map "/path" -> "Nice Label" from the authored nav links.
  const navLabels = {};
  menuList?.querySelectorAll('a').forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (href) navLabels[href] = a.textContent.trim();
  });

  const crumbs = [{ label: 'Home', href: '/' }];
  let current = '';
  segments.forEach((segment) => {
    current += `/${segment}`;
    crumbs.push({ label: navLabels[current] || segmentToLabel(segment), href: current });
  });

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'nav-breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    const isLast = i === crumbs.length - 1;
    if (isLast) {
      li.textContent = crumb.label;
      li.setAttribute('aria-current', 'page');
    } else {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.label;
      li.append(a);
    }
    ol.append(li);
  });
  breadcrumb.append(ol);
  return breadcrumb;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // Classify authored content by meaning (order-independent):
  //   - logo image        -> purple brand bar (NOT sticky)
  //   - "Search" link      -> search form
  //   - a list of links    -> primary nav menu
  //   - the remaining link -> "Brand Hub" wordmark
  const logoImg = fragment.querySelector('picture, img');
  const logoAnchor = logoImg ? logoImg.closest('a') : null;
  const menuList = fragment.querySelector('ul');
  const allAnchors = [...fragment.querySelectorAll('a')];
  const searchAnchor = allAnchors.find((a) => {
    const href = a.getAttribute('href') || '';
    return /\/search\/?$/.test(href) || /search/i.test(a.textContent);
  });
  const brandAnchor = allAnchors.find((a) => a !== logoAnchor
    && a !== searchAnchor
    && !a.closest('ul')
    && !(logoImg && a.contains(logoImg)));

  block.textContent = '';

  // ===== Row 1: purple brand bar (its own wrapper, NOT sticky) =====
  const brandbar = document.createElement('div');
  brandbar.className = 'nav-brandbar';
  if (logoImg) {
    const link = document.createElement('a');
    link.href = (logoAnchor && logoAnchor.getAttribute('href')) || '/';
    link.setAttribute('aria-label', 'GE HealthCare');
    link.append(logoImg.closest('picture') || logoImg);
    const inner = document.createElement('div');
    inner.className = 'nav-brandbar-inner';
    inner.append(link);
    brandbar.append(inner);
  }
  const brandbarWrapper = document.createElement('div');
  brandbarWrapper.className = 'nav-brandbar-wrapper';
  brandbarWrapper.append(brandbar);

  // ===== Row 2: sticky secondary nav row =====
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // "Brand Hub" wordmark
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brandAnchor) {
    const p = document.createElement('p');
    p.append(brandAnchor);
    navBrand.append(p);
  }

  // Primary nav menu
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (menuList) {
    const wrapper = document.createElement('div');
    wrapper.className = 'default-content-wrapper';
    wrapper.append(menuList);
    navSections.append(wrapper);
  }

  // Search form (full box on desktop; toggled panel on mobile)
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  const action = (searchAnchor && searchAnchor.getAttribute('href')) || '/search';
  navTools.innerHTML = `
    <form class="nav-search" role="search" action="${action}" method="get">
      <input type="search" name="q" aria-label="Search" placeholder="Search">
      <button type="submit" aria-label="Search">
        <span class="icon icon-search"></span>
      </button>
    </form>`;

  // Mobile controls: a search-icon toggle + a hamburger (shown < 1024px)
  const navMobileTools = document.createElement('div');
  navMobileTools.className = 'nav-mobile-tools';
  navMobileTools.innerHTML = `
    <button type="button" class="nav-search-toggle" aria-label="Search" aria-expanded="false">
      <span class="icon icon-search"></span>
    </button>
    <div class="nav-hamburger">
      <button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>
    </div>`;

  nav.append(navBrand, navSections, navTools, navMobileTools);

  // Attach the search typeahead (Suggested Keywords + Quick Links dropdown).
  const searchForm = navTools.querySelector('.nav-search');
  if (searchForm) attachSearchTypeahead(searchForm);

  // hamburger opens the menu drawer
  const hamburgerBtn = navMobileTools.querySelector('.nav-hamburger button');
  hamburgerBtn.addEventListener('click', () => toggleMenu(nav, navSections));

  // search icon toggles the search box on mobile
  const searchToggle = navMobileTools.querySelector('.nav-search-toggle');
  searchToggle.addEventListener('click', () => {
    const open = nav.getAttribute('data-search-open') === 'true';
    nav.setAttribute('data-search-open', open ? 'false' : 'true');
    searchToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    if (!open) navTools.querySelector('input')?.focus();
  });

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  // Breadcrumb row below the nav (skipped on the home page).
  const breadcrumb = buildBreadcrumbs(menuList);
  if (breadcrumb) navWrapper.append(breadcrumb);

  decorateIcons(brandbar);
  decorateIcons(nav);

  block.append(brandbarWrapper, navWrapper);
}
