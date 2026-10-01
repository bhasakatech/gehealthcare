import { moveInstrumentation } from '../../scripts/scripts.js';

/* =============================================================================
   Form definitions
   ============================================================================= */

const COUNTRY_OPTIONS = [
  ['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['AU', 'Australia'],
  ['DE', 'Germany'], ['FR', 'France'], ['IN', 'India'], ['JP', 'Japan'], ['CN', 'China'],
  ['BR', 'Brazil'], ['OTHER', 'Other'],
];

const PRODUCT_OPTIONS = [
  ['Imaging', 'Imaging'], ['Ultrasound', 'Ultrasound'],
  ['Patient Care Solutions', 'Patient Care Solutions'],
  ['Pharmaceutical Diagnostics', 'Pharmaceutical Diagnostics'],
  ['Digital Solutions', 'Digital Solutions'],
];

const INTEREST_TEMPLATES = {
  'Price Quote': 'I\'d like a Price Quote on GE HealthCare Technologies Inc.',
  'Product Info': 'I\'d like more information about GE HealthCare products.',
  'Product Demo': 'I\'d like to schedule a Product Demo with GE HealthCare.',
  'Training/Education': 'I\'m interested in Training/Education opportunities from GE HealthCare.',
};

/**
 * Dummy form definitions keyed by form ID. Authors pick one with the block's
 * Form ID field; links to #marketo-form-{id} anywhere on the page open it too.
 * Once Marketo is connected, use the real Marketo form IDs as keys.
 */
const FORMS = {
  1001: {
    name: 'Contact Us',
    title: 'Have a question?',
    accent: 'We would love to hear from you.',
    buttonText: 'Contact Us',
    successText: 'Your submission has been received. We will be in touch shortly.',
    sections: [
      {
        legend: 'What can we help you with?',
        interest: true,
      },
      {
        legend: 'Who should we contact?',
        privacy: true,
        rows: [
          [
            {
              name: 'firstName', label: 'First Name', required: true, autocomplete: 'given-name',
            },
            {
              name: 'lastName', label: 'Last Name', required: true, autocomplete: 'family-name',
            },
          ],
          [
            {
              name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email',
            },
            {
              name: 'phone', label: 'Phone Number:', type: 'tel', autocomplete: 'tel',
            },
          ],
        ],
      },
      {
        legend: 'Where do you work?',
        sub: 'This helps us direct you to the right specialist',
        rows: [
          [
            {
              name: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS, required: true, autocomplete: 'country',
            },
            {
              name: 'zip', label: 'Zip/Postal Code', required: true, autocomplete: 'postal-code',
            },
          ],
          [
            {
              name: 'company', label: 'Company Name:', required: true, autocomplete: 'organization',
            },
            {
              name: 'jobTitle', label: 'Job Title', required: true, autocomplete: 'organization-title',
            },
          ],
        ],
      },
    ],
    optIn: {
      label: 'Please keep me updated on the latest product and <a href="/services" class="marketo-form-privacy-link">services</a> information',
    },
  },
  1002: {
    name: 'Product Demo',
    title: 'Request a product demo',
    accent: 'See our solutions in action.',
    buttonText: 'Request a Demo',
    successText: 'A specialist will contact you shortly to schedule your demo.',
    sections: [
      {
        legend: 'What would you like to see?',
        rows: [
          [
            {
              name: 'product', label: 'Product Area', type: 'select', options: PRODUCT_OPTIONS, required: true,
            },
            { name: 'preferredDate', label: 'Preferred Date', type: 'date' },
          ],
        ],
      },
      {
        legend: 'Who should we contact?',
        privacy: true,
        rows: [
          [
            {
              name: 'firstName', label: 'First Name', required: true, autocomplete: 'given-name',
            },
            {
              name: 'lastName', label: 'Last Name', required: true, autocomplete: 'family-name',
            },
          ],
          [
            {
              name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email',
            },
            {
              name: 'phone', label: 'Phone Number:', type: 'tel', autocomplete: 'tel',
            },
          ],
          [
            {
              name: 'company', label: 'Company Name:', required: true, autocomplete: 'organization',
            },
            {
              name: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS, required: true, autocomplete: 'country',
            },
          ],
          [
            { name: 'comments', label: 'Anything we should know?', type: 'textarea' },
          ],
        ],
      },
    ],
  },
  1003: {
    name: 'Newsletter',
    title: 'Stay in the loop',
    accent: 'Get the latest GE HealthCare news.',
    buttonText: 'Subscribe',
    successText: 'You\'re subscribed! Watch your inbox for the latest updates.',
    sections: [
      {
        legend: 'Where should we send it?',
        privacy: true,
        rows: [
          [
            {
              name: 'firstName', label: 'First Name', required: true, autocomplete: 'given-name',
            },
            {
              name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email',
            },
          ],
          [
            {
              name: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS, required: true, autocomplete: 'country',
            },
          ],
        ],
      },
    ],
    optIn: {
      label: 'I agree to receive GE HealthCare news and updates by email',
      required: true,
    },
  },
};

const DEFAULT_FORM_ID = '1001';
const HASH_PREFIX = '#marketo-form-';

/* =============================================================================
   Markup
   ============================================================================= */

const CLOSE_BUTTON = `
  <button class="marketo-form-close" aria-label="Close dialog" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>`;

const REQUIRED_MARK = '<span class="marketo-form-required" aria-hidden="true">*</span>';

/**
 * Renders one form field.
 * @param {string} formId
 * @param {Object} field Field definition
 * @returns {string} HTML
 */
function renderField(formId, field) {
  const id = `mf-${formId}-${field.name}`;
  const required = field.required ? ' required' : '';
  const autocomplete = field.autocomplete ? ` autocomplete="${field.autocomplete}"` : '';
  let control;
  if (field.type === 'select') {
    const options = field.options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('');
    control = `
      <div class="marketo-form-select-wrapper">
        <select id="${id}" name="${field.name}" class="marketo-form-select"${required}${autocomplete}>
          <option value="">Select...</option>${options}
        </select>
        <span class="marketo-form-select-arrow" aria-hidden="true">&#8964;</span>
      </div>`;
  } else if (field.type === 'textarea') {
    control = `<textarea id="${id}" name="${field.name}" class="marketo-form-input marketo-form-textarea" rows="3" placeholder=" "${required}></textarea>`;
  } else {
    control = `<input type="${field.type || 'text'}" id="${id}" name="${field.name}" class="marketo-form-input" placeholder=" "${required}${autocomplete}>`;
  }
  return `
    <div class="marketo-form-field">
      <label class="marketo-form-label" for="${id}">${field.label}${field.required ? REQUIRED_MARK : ''}</label>
      ${control}
    </div>`;
}

/**
 * Renders the interest tabs and pre-filled message used by the Contact Us form.
 * @returns {string} HTML
 */
function renderInterest() {
  const tabs = Object.keys(INTEREST_TEMPLATES).map((value, i) => `
    <button type="button" class="marketo-form-tab${i === 0 ? ' is-active' : ''}" data-value="${value}" aria-pressed="${i === 0}">${value}</button>`).join('');
  const [first] = Object.keys(INTEREST_TEMPLATES);
  return `
    <div class="marketo-form-tabs" role="group" aria-label="Interest type">${tabs}</div>
    <input type="hidden" name="interest" value="${first}">
    <textarea class="marketo-form-interest-text" name="interestDetail" aria-label="Tell us more about your interest" rows="4">${INTEREST_TEMPLATES[first]}</textarea>`;
}

/**
 * Renders one fieldset of the form.
 * @param {string} formId
 * @param {Object} section Section definition
 * @returns {string} HTML
 */
function renderSection(formId, section) {
  let sub = '';
  if (section.privacy) {
    sub = `
      <span class="marketo-form-legend-sub">
        Your privacy matters, <a href="/privacy-policy" class="marketo-form-privacy-link">learn</a> about our <a href="/privacy-policy" class="marketo-form-privacy-link">privacy policy</a>.
      </span>`;
  } else if (section.sub) {
    sub = `<span class="marketo-form-legend-sub marketo-form-legend-sub-accent">${section.sub}</span>`;
  }
  const rows = (section.rows || []).map((row) => `
    <div class="marketo-form-row">${row.map((field) => renderField(formId, field)).join('')}</div>`).join('');
  return `
    <fieldset class="marketo-form-fieldset">
      <legend class="marketo-form-legend">${section.legend}${sub}</legend>
      ${section.interest ? renderInterest() : ''}
      ${rows}
    </fieldset>`;
}

/**
 * Builds the modal overlay with the form, success and error panels for a form ID.
 * @param {string} formId
 * @returns {HTMLElement} The modal element
 */
function buildModal(formId) {
  const config = FORMS[formId];
  const titleId = `mf-${formId}-title`;
  const modal = document.createElement('div');
  modal.className = 'marketo-form-modal';
  modal.dataset.formId = formId;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', titleId);
  modal.setAttribute('hidden', '');

  const optIn = config.optIn ? `
    <div class="marketo-form-optin">
      <label class="marketo-form-checkbox-label">
        <input type="checkbox" name="optIn" class="marketo-form-checkbox"${config.optIn.required ? ' required' : ''}>
        <span>${config.optIn.label}${config.optIn.required ? REQUIRED_MARK : ''}</span>
      </label>
    </div>` : '';

  modal.innerHTML = `
    <div class="marketo-form-dialog">
      ${CLOSE_BUTTON}
      <div class="marketo-form-dialog-body">
        <h2 id="${titleId}" class="marketo-form-dialog-title">
          ${config.title}
          <span class="marketo-form-title-accent"> ${config.accent}</span>
        </h2>

        <form class="marketo-form-form" novalidate>
          ${config.sections.map((section) => renderSection(formId, section)).join('')}
          ${optIn}

          <p class="marketo-form-recaptcha">This site is protected by reCAPTCHA.</p>

          <div class="marketo-form-submit-row">
            <button type="submit" class="button primary marketo-form-submit">Submit</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success panel (separate slide, centered on the page) -->
    <div class="marketo-form-result marketo-form-success" hidden role="status" aria-live="polite">
      ${CLOSE_BUTTON}
      <div class="marketo-form-result-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" focusable="false">
          <polyline points="5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="marketo-form-result-title">Thank you!</h2>
      <p class="marketo-form-result-text">${config.successText}</p>
      <button type="button" class="button primary marketo-form-success-done">Close</button>
    </div>

    <!-- Error panel (separate slide, centered on the page) -->
    <div class="marketo-form-result marketo-form-error" hidden role="alert" aria-live="assertive">
      ${CLOSE_BUTTON}
      <div class="marketo-form-result-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" focusable="false">
          <line x1="12" y1="6" x2="12" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <h2 class="marketo-form-result-title">Something went wrong</h2>
      <p class="marketo-form-result-text">We couldn't submit your request. Please check your connection and try again.</p>
      <button type="button" class="button primary marketo-form-error-retry">Try again</button>
    </div>
  `;

  return modal;
}

/* =============================================================================
   Modal behaviour
   ============================================================================= */

/** Built modals keyed by form ID, with the element that last opened each. */
const modals = new Map();

/**
 * Marks the given interest tab as active and updates the hidden input and textarea.
 * @param {HTMLElement} modal
 * @param {HTMLElement} tab
 */
function selectTab(modal, tab) {
  if (!tab) return;
  modal.querySelectorAll('.marketo-form-tab').forEach((t) => {
    t.classList.toggle('is-active', t === tab);
    t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
  });
  const { value } = tab.dataset;
  const hiddenInput = modal.querySelector('input[name="interest"]');
  const textarea = modal.querySelector('.marketo-form-interest-text');
  if (hiddenInput) hiddenInput.value = value;
  if (textarea) textarea.value = INTEREST_TEMPLATES[value] || '';
}

/**
 * Shows one panel (form dialog, success or error) and hides the others.
 * @param {HTMLElement} modal
 * @param {string} selector Selector of the panel to show
 * @returns {HTMLElement} The visible panel
 */
function showPanel(modal, selector) {
  modal.querySelectorAll('.marketo-form-dialog, .marketo-form-result').forEach((panel) => {
    panel.toggleAttribute('hidden', !panel.matches(selector));
  });
  return modal.querySelector(selector);
}

/**
 * Restores the form to its initial, empty state and shows the form view.
 * @param {HTMLElement} modal
 */
function resetForm(modal) {
  const form = modal.querySelector('.marketo-form-form');
  const submitBtn = form.querySelector('.marketo-form-submit');
  form.reset();
  selectTab(modal, modal.querySelector('.marketo-form-tab'));
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit';
  showPanel(modal, '.marketo-form-dialog');
}

/**
 * Returns the focusable elements of the currently visible panel.
 * @param {HTMLElement} modal
 * @returns {HTMLElement[]}
 */
function getFocusable(modal) {
  const panel = modal.querySelector('.marketo-form-dialog:not([hidden]), .marketo-form-result:not([hidden])');
  if (!panel) return [];
  return [...panel.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];
}

/**
 * Closes the modal and returns focus to the element that opened it.
 * @param {string} formId
 */
function closeForm(formId) {
  const entry = modals.get(formId);
  if (!entry || entry.modal.hidden) return;
  entry.modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (entry.trigger) entry.trigger.focus();
}

/**
 * Opens the form for an ID with fresh values.
 * @param {string} formId
 * @param {HTMLElement} trigger — element to return focus to on close
 */
function openForm(formId, trigger) {
  const entry = modals.get(formId);
  if (!entry) return;
  entry.trigger = trigger;
  resetForm(entry.modal);
  entry.modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  entry.modal.querySelector('.marketo-form-dialog .marketo-form-close').focus();
}

/* =============================================================================
   Submission
   ============================================================================= */

/**
 * Marketo Forms 2.0 instance configuration. Fill these in with the values from
 * Marketo Admin > Integration > Munchkin to send submissions to Marketo; the
 * form ID comes from the block. While empty, data is POSTed to FORM_ENDPOINT.
 */
const MARKETO_CONFIG = {
  baseUrl: '', // e.g. '//app-ab12.marketo.com'
  munchkinId: '', // e.g. '123-ABC-456'
};

/**
 * Endpoint the form data is POSTed to when Marketo Forms 2.0 is not configured.
 * Replace with the real form endpoint once it is available.
 */
const FORM_ENDPOINT = '/api/marketo-form';

/** Maps our form field names to Marketo field API names. */
const MARKETO_FIELD_MAP = {
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  phone: 'Phone',
  country: 'Country',
  zip: 'PostalCode',
  company: 'Company',
  jobTitle: 'Title',
};

const marketoForms = new Map();

/**
 * Loads the Marketo Forms 2.0 library and a hidden instance of the given form.
 * @param {string} formId
 * @returns {Promise<Object>} The Marketo form object
 */
function loadMarketoForm(formId) {
  if (marketoForms.has(formId)) return marketoForms.get(formId);
  const { baseUrl, munchkinId } = MARKETO_CONFIG;
  const promise = new Promise((resolve, reject) => {
    const init = () => {
      const formEl = document.createElement('form');
      formEl.id = `mktoForm_${formId}`;
      formEl.hidden = true;
      document.body.append(formEl);
      window.MktoForms2.loadForm(baseUrl, munchkinId, formId, resolve);
    };
    if (window.MktoForms2) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.src = `${baseUrl}/js/forms2/js/forms2.min.js`;
    script.onload = init;
    script.onerror = () => reject(new Error('Failed to load Marketo Forms 2.0 library'));
    document.head.append(script);
  });
  promise.catch(() => marketoForms.delete(formId));
  marketoForms.set(formId, promise);
  return promise;
}

/**
 * Submits the data through the Marketo Forms 2.0 API.
 * @param {string} formId
 * @param {Object} data Form values keyed by our field names
 * @returns {Promise<void>}
 */
async function submitToMarketo(formId, data) {
  const mktoForm = await loadMarketoForm(formId);
  const values = {};
  Object.entries(data).forEach(([key, value]) => {
    values[MARKETO_FIELD_MAP[key] || key] = value;
  });
  return new Promise((resolve, reject) => {
    mktoForm.addHiddenFields(values);
    mktoForm.onSuccess(() => {
      resolve();
      return false; // stay on the page instead of following Marketo's redirect
    });
    if (!mktoForm.submittable()) {
      reject(new Error('Marketo form is not submittable'));
      return;
    }
    mktoForm.submit();
  });
}

/**
 * Posts the data as JSON to FORM_ENDPOINT.
 * @param {string} formId
 * @param {Object} data Form values keyed by our field names
 * @returns {Promise<void>}
 */
async function submitToEndpoint(formId, data) {
  const res = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formId, ...data }),
  });
  // 404/405 mean no endpoint is deployed yet (EDS answers POSTs to unknown
  // paths with 405), so treat them as success until the real endpoint is set.
  if (!res.ok && res.status !== 404 && res.status !== 405) {
    throw new Error(`HTTP ${res.status}`);
  }
}

/**
 * Handles form submission — sends data to Marketo when configured, otherwise
 * to FORM_ENDPOINT, then shows the success or error panel.
 * @param {HTMLElement} modal
 */
async function handleSubmit(modal) {
  const { formId } = modal.dataset;
  const form = modal.querySelector('.marketo-form-form');
  const submitBtn = form.querySelector('.marketo-form-submit');

  // Basic HTML5 validation
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const { baseUrl, munchkinId } = MARKETO_CONFIG;
    if (baseUrl && munchkinId) {
      await submitToMarketo(formId, data);
    } else {
      await submitToEndpoint(formId, data);
    }
    // eslint-disable-next-line no-console
    console.info(`Marketo form ${formId} submitted`, data);
    form.reset();
    showPanel(modal, '.marketo-form-success')
      .querySelector('.marketo-form-success-done').focus();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Marketo form ${formId} submission failed`, err);
    // Keep the entered values so the visitor can retry without refilling
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
    showPanel(modal, '.marketo-form-error')
      .querySelector('.marketo-form-error-retry').focus();
  }
}

/**
 * Builds the modal for a form ID once per page and wires up its behaviour.
 * @param {string} formId
 */
function ensureModal(formId) {
  if (modals.has(formId)) return;
  const modal = buildModal(formId);
  modals.set(formId, { modal, trigger: null });

  modal.querySelectorAll('.marketo-form-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(modal, tab));
  });

  modal.querySelectorAll('.marketo-form-close, .marketo-form-success-done').forEach((btn) => {
    btn.addEventListener('click', () => closeForm(formId));
  });

  // Back to the filled-in form after an error
  modal.querySelector('.marketo-form-error-retry').addEventListener('click', () => {
    showPanel(modal, '.marketo-form-dialog');
    modal.querySelector('.marketo-form-submit').focus();
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeForm(formId);
  });

  // Close on Escape and trap focus within the visible panel
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeForm(formId);
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(modal);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else if (document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  modal.querySelector('.marketo-form-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(modal);
  });

  document.body.append(modal);
}

/**
 * Returns the form ID referenced by a #marketo-form-{id} hash, if it is known.
 * @param {string} hash
 * @returns {string|null}
 */
function formIdFromHash(hash) {
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  const formId = hash.slice(HASH_PREFIX.length);
  return FORMS[formId] ? formId : null;
}

let hashLinksReady = false;

/**
 * Lets any link to #marketo-form-{id} on the page open that form, and opens
 * it straight away when the page is loaded with such a hash.
 */
function initHashLinks() {
  if (hashLinksReady) return;
  hashLinksReady = true;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#marketo-form-"]');
    if (!link) return;
    const formId = formIdFromHash(new URL(link.href, window.location.href).hash);
    if (!formId) return;
    e.preventDefault();
    ensureModal(formId);
    openForm(formId, link);
  });

  const openFromLocation = () => {
    const formId = formIdFromHash(window.location.hash);
    if (!formId) return;
    ensureModal(formId);
    openForm(formId, null);
  };
  window.addEventListener('hashchange', openFromLocation);
  openFromLocation();
}

/* =============================================================================
   Block
   ============================================================================= */

/**
 * Loads and decorates the Marketo Form block.
 *
 * Authored structure (one row per field):
 *   Row 1 — Title (heading or text)
 *   Row 2 — Description (rich text)
 *   Row 3 — Form ID (e.g. 1001); falls back to 1001 when empty or unknown
 *   Row 4 — Button text; falls back to the form's default label
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // 1. Extract authored content from block rows
  const [titleRow, descRow, ...rest] = [...block.children];
  // Form ID and button text are told apart by content so row order can vary
  const formIdRow = rest.find((row) => /^\d+$/.test(row.textContent.trim()));
  const buttonRow = rest.find((row) => row !== formIdRow && row.textContent.trim());

  let formId = formIdRow?.textContent.trim() || DEFAULT_FORM_ID;
  if (!FORMS[formId]) {
    // eslint-disable-next-line no-console
    console.warn(`Unknown Marketo form ID "${formId}", using ${DEFAULT_FORM_ID}`);
    formId = DEFAULT_FORM_ID;
  }
  block.dataset.formId = formId;

  // 2. Build the teaser section
  const teaser = document.createElement('div');
  teaser.className = 'marketo-form-teaser';

  if (titleRow) {
    const titleEl = document.createElement('div');
    titleEl.className = 'marketo-form-teaser-title';
    moveInstrumentation(titleRow, titleEl);
    while (titleRow.firstElementChild?.firstChild) {
      titleEl.append(titleRow.firstElementChild.firstChild);
    }
    teaser.append(titleEl);
  }

  if (descRow) {
    const descEl = document.createElement('div');
    descEl.className = 'marketo-form-teaser-desc';
    moveInstrumentation(descRow, descEl);
    while (descRow.firstElementChild?.firstChild) {
      descEl.append(descRow.firstElementChild.firstChild);
    }
    teaser.append(descEl);
  }

  // 3. Build the trigger button
  const triggerWrapper = document.createElement('p');
  triggerWrapper.className = 'button-wrapper';

  const triggerBtn = document.createElement('button');
  triggerBtn.type = 'button';
  triggerBtn.className = 'button primary marketo-form-trigger';
  triggerBtn.textContent = buttonRow?.textContent.trim() || FORMS[formId].buttonText;
  if (buttonRow) moveInstrumentation(buttonRow, triggerBtn);

  triggerWrapper.append(triggerBtn);
  teaser.append(triggerWrapper);

  // 4. Build the modal (once per form ID) and wire up opening
  ensureModal(formId);
  triggerBtn.addEventListener('click', () => openForm(formId, triggerBtn));
  initHashLinks();

  // 5. Render
  block.replaceChildren(teaser);
}
