import { getMetadata } from '../../scripts/aem.js';

/**
 * Cookie Consent — the site-wide cookie banner and preferences dialog.
 *
 * Authored once (see _cookie-consent.json) in a Cookie Consent block on the
 * `/cookie-consent` fragment page (override with `cookie-consent` metadata).
 * scripts.js injects an empty instance of this block on every page; it then
 * reads the fragment's content and shows the banner until the visitor chooses.
 * Placed directly on a page (the fragment itself, or in Universal Editor) the
 * block renders banner and preferences inline so authors can see both.
 *
 * Authored rows, in model order, one cell each:
 *   [message (heading = banner title), preferences, logo,
 *    buttons (decline / accept / customize / save labels, one per paragraph)]
 * followed by "Cookie Category" item rows: [name, key, description, required].
 * Empty fields fall back to the defaults below (the live brand hub's copy).
 * The sidebar "Privacy Policy" link reuses the first link in the authored copy.
 *
 * Links to `#cookie-preferences` anywhere on the page (or a "#" link whose
 * text mentions cookies, like the footer's "Cookie Preference") reopen the
 * preferences dialog.
 *
 * The visitor's choice is stored in localStorage and mirrored into the
 * `gehc-cookie-consent` cookie (allowed category keys, comma-separated) so
 * tags can check it before setting non-essential cookies.
 */

const CONSENT_KEY = 'gehc-cookie-consent';
const ESSENTIAL = 'essential';
const PRIVACY_URL = 'https://www.gehealthcare.com/about/privacy/privacy-policy';
const PREFS_HASH = '#cookie-preferences';

const DEFAULTS = {
  title: 'About Cookies On This Site',
  message: `<p>We use cookies to personalize and enhance your experience on our site as well as the communications we send you. Visit our <a href="${PRIVACY_URL}">Privacy Policy</a> to learn more or manage your personal preferences in our <a href="${PREFS_HASH}">Cookie Consent Tool</a>.</p>`,
  declineLabel: 'Allow necessary only',
  acceptLabel: 'Accept all',
  customizeLabel: 'Customize cookies',
  preferences: `<h2>Information We Collect About You</h2>
    <p>We want to be transparent about the data we and our partners collect and how we use it, so you can best exercise control over your personal data. For more information, please see our <a href="${PRIVACY_URL}">Privacy Policy</a>.</p>
    <h3>Information Our Partners Collect</h3>
    <p>We use the following partners to better improve your overall web browsing experience. They use cookies and other mechanisms to connect you with your social networks and tailor advertising to better match your interests. You can elect to opt-out of this information collection by unticking the boxes below.</p>`,
  privacyLink: PRIVACY_URL,
  privacyLinkText: 'Privacy Policy',
  saveLabel: 'Confirm my choices',
  categories: [
    {
      key: 'analytics',
      name: 'Analytics',
      description: 'We use analytical cookies to measure how you use our website so we may continually improve it. For example, these cookies allow us to recognize and count the number of visitors to our website and see which pages visitors view.',
    },
    {
      key: 'marketing',
      name: 'Marketing and Personalization',
      description: 'These cookies track visitor activity and sessions so that we can deliver a more personalized experience and more personalized communications. We use marketing cookies to display personalized advertisements on other sites you may visit to deliver relevant content and measure the effectiveness of our marketing investments.',
    },
    {
      key: 'functional',
      name: 'Functional and Performance',
      description: 'These cookies help us measure the website’s performance and improve your experience. In using performance cookies, we do not store any personal data, and only use the information collected through these cookies in aggregated and anonymized form.',
    },
    {
      key: ESSENTIAL,
      name: 'Essential Cookies',
      description: 'These cookies are required for the operation of this website. They help enable core functionality such as network management and accessibility. You can set your browser to block or alert you about these cookies, but this may cause some parts of our site not to work.',
      required: true,
    },
  ],
};

const LABELS = ['declineLabel', 'acceptLabel', 'customizeLabel', 'saveLabel'];

/** The stored choice ({ categories }), or null if the visitor hasn't decided. */
function getConsent() {
  try {
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY));
    return consent?.categories ? consent : null;
  } catch (e) {
    return null;
  }
}

/** Stores the visitor's choice (essential is always allowed). */
function saveConsent(categories) {
  const consent = {
    timestamp: new Date().toISOString(),
    categories: { ...categories, [ESSENTIAL]: true },
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (e) {
    // storage unavailable — the cookie below still records the choice
  }
  const allowed = Object.keys(consent.categories).filter((key) => consent.categories[key]);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_KEY}=${encodeURIComponent(allowed.join(','))}; max-age=31536000; path=/; SameSite=Lax${secure}`;
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Reads the authored rows into a config, falling back to DEFAULTS per field.
 * @param {Element[]} rows The block's authored rows
 */
function readConfig(rows) {
  const config = { ...DEFAULTS };
  const fieldCells = rows.filter((row) => row.children.length === 1)
    .map((row) => row.firstElementChild);
  const itemRows = rows.filter((row) => row.children.length > 1);

  const [messageCell, prefsCell, logoCell, buttonsCell] = fieldCells;
  const hasText = (cell) => !!cell?.textContent.trim();

  const privacy = [messageCell, prefsCell]
    .flatMap((cell) => (cell ? [...cell.querySelectorAll('a[href]')] : []))
    .find((a) => !a.getAttribute('href').startsWith('#'));
  if (privacy) config.privacyLink = privacy.href;

  if (hasText(messageCell)) {
    const heading = messageCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      config.title = heading.textContent.trim();
      heading.remove();
    }
    if (hasText(messageCell)) config.message = messageCell.innerHTML;
  }
  if (hasText(prefsCell)) config.preferences = prefsCell.innerHTML;
  config.logo = logoCell?.querySelector('picture, img') || null;

  if (hasText(buttonsCell)) {
    const paras = [...buttonsCell.querySelectorAll('p')];
    const labels = paras.length
      ? paras.map((p) => p.textContent.trim())
      : [buttonsCell.textContent.trim()];
    LABELS.forEach((key, i) => { if (labels[i]) config[key] = labels[i]; });
  }

  const categories = itemRows.map((row) => {
    const [name, key, description, required] = [...row.children].map((c) => c.textContent.trim());
    return {
      name,
      key: slug(key || name || ''),
      description,
      required: required === 'true',
    };
  }).filter((c) => c.name);
  if (categories.length) config.categories = categories;
  return config;
}

/**
 * Fetches the shared cookie consent fragment and returns its block rows.
 * The fragment is read raw (not decorated) so its own block doesn't render.
 */
async function fetchAuthoredRows() {
  const meta = getMetadata('cookie-consent');
  const path = meta ? new URL(meta, window.location).pathname : '/cookie-consent';
  try {
    const resp = await fetch(`${path.replace(/(\.plain)?\.html$/, '')}.plain.html`);
    if (!resp.ok) return [];
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const block = doc.querySelector('.cookie-consent');
    return block ? [...block.children] : [];
  } catch (e) {
    return [];
  }
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof content === 'string') node.textContent = content;
  return node;
}

function richText(html, className) {
  const div = el('div', className);
  div.innerHTML = html;
  // off-site links (privacy policy) open in a new tab, like the source
  div.querySelectorAll('a[href]').forEach((a) => {
    if (a.getAttribute('href').startsWith('#')) return;
    if (new URL(a.href).origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
  return div;
}

function button(label, action, variant = 'primary') {
  const btn = el('button', `cookie-consent-button cookie-consent-button-${variant}`, label);
  btn.type = 'button';
  btn.dataset.action = action;
  return btn;
}

const isPrefsLink = (a) => {
  const href = a.getAttribute('href') || '';
  return href.endsWith(PREFS_HASH) || (href === '#' && /cookie/i.test(a.textContent));
};

let uid = 0;

/**
 * Builds the banner + preferences dialog and wires up their behavior.
 * @param {Element} block The block element
 * @param {Object} config See readConfig
 * @param {boolean} inline Render in the page flow (authoring) instead of overlaid
 */
function render(block, config, inline) {
  uid += 1;
  const id = (name) => `cookie-consent-${name}-${uid}`;
  const optional = config.categories.filter((c) => !c.required);

  // --- Banner ---
  const banner = el('div', 'cookie-consent-banner');
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-labelledby', id('title'));
  const title = el('h2', 'cookie-consent-title', config.title);
  title.id = id('title');
  const bannerActions = el('div', 'cookie-consent-actions');
  bannerActions.append(button(config.declineLabel, 'decline'), button(config.acceptLabel, 'accept'));
  const customize = button(config.customizeLabel, 'customize', 'outline');
  customize.setAttribute('aria-haspopup', 'dialog');
  banner.append(title, bannerActions, richText(config.message, 'cookie-consent-message'), customize);

  // --- Preferences dialog ---
  const dialog = el('dialog', 'cookie-consent-dialog');

  const sidebar = el('div', 'cookie-consent-sidebar');
  if (config.logo) {
    const logo = el('div', 'cookie-consent-logo');
    logo.append(config.logo);
    sidebar.append(logo);
  }
  const nav = el('nav', 'cookie-consent-nav');
  nav.setAttribute('aria-label', 'Privacy dialog navigation');
  const navList = el('ul');
  const infoLi = el('li');
  const infoBtn = el('button', 'cookie-consent-nav-item cookie-consent-nav-current', 'Information We Collect');
  infoBtn.type = 'button';
  infoBtn.setAttribute('aria-current', 'true');
  infoLi.append(infoBtn);
  const privacyLi = el('li');
  const privacyA = el('a', 'cookie-consent-nav-item cookie-consent-nav-external', config.privacyLinkText);
  privacyA.href = config.privacyLink;
  privacyA.target = '_blank';
  privacyA.rel = 'noopener noreferrer';
  privacyA.append(el('span', 'cookie-consent-visually-hidden', ' (opens in a new tab)'));
  privacyLi.append(privacyA);
  navList.append(infoLi, privacyLi);
  nav.append(navList);
  sidebar.append(nav);

  const panel = el('div', 'cookie-consent-panel');
  const close = el('button', 'cookie-consent-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close dialog');
  close.dataset.action = 'close';

  const content = el('div', 'cookie-consent-content');
  const prefsText = richText(config.preferences, 'cookie-consent-prefs-text');
  const headings = prefsText.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((h) => h.classList.add('cookie-consent-prefs-title'));
  // the dialog is named by (and focuses) its first heading
  const prefsTitle = headings[0] || prefsText;
  prefsTitle.id = id('prefs-title');
  prefsTitle.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', prefsTitle.id);

  // master switch + "n of m allowed" counter
  const all = el('div', 'cookie-consent-all');
  const allLabel = el('span', 'cookie-consent-all-label', 'Categories');
  allLabel.id = id('all');
  const count = el('span', 'cookie-consent-count');
  count.setAttribute('aria-live', 'polite');
  const switchFor = (labelId, key) => {
    const label = el('label', 'cookie-consent-switch');
    const input = el('input');
    input.type = 'checkbox';
    input.setAttribute('role', 'switch');
    input.setAttribute('aria-labelledby', labelId);
    if (key) input.dataset.category = key;
    label.append(input, el('span', 'cookie-consent-slider'));
    return { label, input };
  };
  const allSwitch = switchFor(allLabel.id);
  all.append(allLabel, count, allSwitch.label);

  const list = el('ul', 'cookie-consent-categories');
  const inputs = [];
  config.categories.forEach((category, i) => {
    const li = el('li', 'cookie-consent-category');
    const head = el('div', 'cookie-consent-category-head');
    const name = el('h4', 'cookie-consent-category-name', category.name);
    name.id = id(`cat-${i}`);
    head.append(name);
    if (category.required) {
      head.append(el('span', 'cookie-consent-required', 'Required'));
    } else {
      const { label, input } = switchFor(name.id, category.key);
      inputs.push(input);
      head.append(label);
    }
    li.append(head);
    if (category.description) li.append(el('p', 'cookie-consent-category-text', category.description));
    list.append(li);
  });

  content.append(prefsText, all, list);

  const dialogActions = el('div', 'cookie-consent-dialog-actions');
  dialogActions.append(
    button(config.declineLabel, 'decline'),
    button(config.saveLabel, 'save', 'outline'),
    button(config.acceptLabel, 'accept'),
  );
  panel.append(close, content, dialogActions);
  dialog.append(sidebar, panel);

  // --- State ---
  const syncAll = () => {
    const on = inputs.filter((input) => input.checked).length;
    count.textContent = `${on} of ${inputs.length} allowed`;
    allSwitch.input.checked = on > 0 && on === inputs.length;
    allSwitch.input.indeterminate = on > 0 && on < inputs.length;
  };
  const loadChoices = () => {
    const stored = getConsent()?.categories || {};
    inputs.forEach((input) => { input.checked = !!stored[input.dataset.category]; });
    syncAll();
  };
  allSwitch.input.addEventListener('change', () => {
    inputs.forEach((input) => { input.checked = allSwitch.input.checked; });
    syncAll();
  });
  inputs.forEach((input) => input.addEventListener('change', syncAll));

  let opener = null;
  const showBanner = (show) => { banner.hidden = !show; };
  const openPrefs = () => {
    loadChoices();
    if (inline) return;
    opener = document.activeElement;
    showBanner(false);
    dialog.showModal();
    content.scrollTop = 0;
    prefsTitle.focus();
  };
  const closePrefs = () => {
    if (inline) return;
    if (dialog.open) dialog.close();
  };
  dialog.addEventListener('close', () => {
    if (!getConsent()) showBanner(true);
    if (opener && opener.isConnected && !banner.contains(opener)) opener.focus();
    else if (!banner.hidden) banner.querySelector('button')?.focus();
    opener = null;
  });
  // clicking the backdrop (outside the dialog box) closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closePrefs(); });

  const decide = (categories) => {
    saveConsent(categories);
    if (inline) {
      loadChoices();
      return;
    }
    showBanner(false);
    closePrefs();
  };
  const choose = (value) => Object.fromEntries(optional.map((c) => [c.key, value]));

  block.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && isPrefsLink(link)) {
      e.preventDefault();
      openPrefs();
      return;
    }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'decline') decide(choose(false));
    else if (action === 'accept') decide(choose(true));
    else if (action === 'save') decide(Object.fromEntries(inputs.map((i) => [i.dataset.category, i.checked])));
    else if (action === 'customize') openPrefs();
    else if (action === 'close') closePrefs();
  });
  infoBtn.addEventListener('click', () => { content.scrollTop = 0; prefsTitle.focus(); });

  if (inline) {
    block.classList.add('cookie-consent-inline');
    dialog.setAttribute('open', '');
    loadChoices();
  } else {
    showBanner(!getConsent());
  }
  block.replaceChildren(banner, dialog);
  return { openPrefs };
}

export default async function decorate(block) {
  // Authored instance (fragment page / Universal Editor): render inline.
  if (block.children.length) {
    render(block, readConfig([...block.children]), true);
    return;
  }

  // Global instance injected by scripts.js: overlay banner + modal dialog.
  let ui = null;
  const build = async () => {
    if (!ui) ui = render(block, readConfig(await fetchAuthoredRows()), false);
    return ui;
  };

  // "Cookie Preference" links elsewhere on the page (e.g. the footer).
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link || block.contains(link) || !isPrefsLink(link)) return;
    e.preventDefault();
    (await build()).openPrefs();
  });

  // Returning visitors who already chose don't need the banner built at all.
  if (!getConsent()) await build();
}
