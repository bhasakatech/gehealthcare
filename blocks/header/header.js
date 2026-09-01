import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
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

  // Read the authored model fields from the fragment and rebuild a clean,
  // semantic two-row header. Rather than trusting fixed row positions, classify
  // the authored content by meaning so the header stays correct even if authors
  // reorder rows:
  //   - logo image        → purple brand bar (row 1)
  //   - "Search" link      → search form in tools
  //   - a list of links    → primary nav menu (sections)
  //   - the remaining link → "Brand Hub" wordmark (brand)
  const logoImg = fragment.querySelector('picture, img');
  const logoAnchor = logoImg ? logoImg.closest('a') : null;
  const menuList = fragment.querySelector('ul');
  const allAnchors = [...fragment.querySelectorAll('a')];
  const searchAnchor = allAnchors.find((a) => {
    const href = a.getAttribute('href') || '';
    return /\/search\/?$/.test(href) || /search/i.test(a.textContent);
  });
  // The wordmark is a standalone link that is not the logo, not the search,
  // and not inside the nav menu list.
  const brandAnchor = allAnchors.find((a) => a !== logoAnchor
    && a !== searchAnchor
    && !a.closest('ul')
    && !(logoImg && a.contains(logoImg)));

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // --- Row 1: purple brand bar with the GE HealthCare logo ---
  const navBrandbar = document.createElement('div');
  navBrandbar.className = 'nav-brandbar';
  if (logoImg) {
    const link = document.createElement('a');
    link.href = (logoAnchor && logoAnchor.getAttribute('href')) || '/';
    link.setAttribute('aria-label', 'GE HealthCare');
    link.append(logoImg.closest('picture') || logoImg);
    const p = document.createElement('p');
    p.append(link);
    navBrandbar.append(p);
  }
  nav.append(navBrandbar);

  // --- "Brand Hub" wordmark ---
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brandAnchor) {
    const p = document.createElement('p');
    p.append(brandAnchor);
    navBrand.append(p);
  }
  nav.append(navBrand);

  // --- Primary nav menu ---
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (menuList) {
    const wrapper = document.createElement('div');
    wrapper.className = 'default-content-wrapper';
    wrapper.append(menuList);
    navSections.append(wrapper);
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }
  nav.append(navSections);

  // --- Tools: build a real search form from the "Search" link ---
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
  nav.append(navTools);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // render inline SVG icons (GE logo, search)
  decorateIcons(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
