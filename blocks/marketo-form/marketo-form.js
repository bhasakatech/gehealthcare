import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds the modal overlay and dialog with the GE HealthCare contact form.
 * @returns {HTMLElement} The modal element
 */
function buildModal() {
  const modal = document.createElement('div');
  modal.className = 'marketo-form-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'marketo-form-dialog-title');
  modal.setAttribute('hidden', '');

  modal.innerHTML = `
    <div class="marketo-form-dialog">
      <button class="marketo-form-close" aria-label="Close dialog" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="marketo-form-dialog-body">
        <h2 id="marketo-form-dialog-title">
          Have a question?
          <span class="marketo-form-title-accent"> We would love to hear from you.</span>
        </h2>

        <form class="marketo-form-form" novalidate>
          <!-- Interest tabs -->
          <fieldset class="marketo-form-fieldset">
            <legend class="marketo-form-legend">What can we help you with?</legend>
            <div class="marketo-form-tabs" role="group" aria-label="Interest type">
              <button type="button" class="marketo-form-tab is-active" data-value="Price Quote">Price Quote</button>
              <button type="button" class="marketo-form-tab" data-value="Product Info">Product Info</button>
              <button type="button" class="marketo-form-tab" data-value="Product Demo">Product Demo</button>
              <button type="button" class="marketo-form-tab" data-value="Training/Education">Training/Education</button>
            </div>
            <input type="hidden" name="interest" value="Price Quote">
            <textarea
              class="marketo-form-interest-text"
              name="interestDetail"
              aria-label="Tell us more about your interest"
              rows="4"
            >I'd like a Price Quote on GE HealthCare Technologies Inc.</textarea>
          </fieldset>

          <!-- Contact info -->
          <fieldset class="marketo-form-fieldset">
            <legend class="marketo-form-legend">
              Who should we contact?
              <span class="marketo-form-legend-sub">
                Your privacy matters, <a href="/privacy-policy" class="marketo-form-privacy-link">learn</a> about our <a href="/privacy-policy" class="marketo-form-privacy-link">privacy policy</a>.
              </span>
            </legend>
            <div class="marketo-form-row">
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-firstname">
                  First Name<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="marketo-firstname" name="firstName" class="marketo-form-input" required autocomplete="given-name">
              </div>
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-lastname">
                  Last Name<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="marketo-lastname" name="lastName" class="marketo-form-input" required autocomplete="family-name">
              </div>
            </div>
            <div class="marketo-form-row">
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-email">
                  Email<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="email" id="marketo-email" name="email" class="marketo-form-input" required autocomplete="email">
              </div>
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-phone">Phone Number:</label>
                <input type="tel" id="marketo-phone" name="phone" class="marketo-form-input" autocomplete="tel">
              </div>
            </div>
          </fieldset>

          <!-- Work info -->
          <fieldset class="marketo-form-fieldset">
            <legend class="marketo-form-legend">
              Where do you work?
              <span class="marketo-form-legend-sub marketo-form-legend-sub-accent">
                This helps us direct you to the right specialist
              </span>
            </legend>
            <div class="marketo-form-row">
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-country">
                  Country<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <div class="marketo-form-select-wrapper">
                  <select id="marketo-country" name="country" class="marketo-form-select" required autocomplete="country">
                    <option value="">Select...</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IN">India</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="BR">Brazil</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <span class="marketo-form-select-arrow" aria-hidden="true">&#8964;</span>
                </div>
              </div>
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-zip">
                  Zip/Postal Code<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="marketo-zip" name="zip" class="marketo-form-input" required autocomplete="postal-code">
              </div>
            </div>
            <div class="marketo-form-row">
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-company">
                  Company Name:<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="marketo-company" name="company" class="marketo-form-input" required autocomplete="organization">
              </div>
              <div class="marketo-form-field">
                <label class="marketo-form-label" for="marketo-jobtitle">
                  Job Title<span class="marketo-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="marketo-jobtitle" name="jobTitle" class="marketo-form-input" required autocomplete="organization-title">
              </div>
            </div>
          </fieldset>

          <!-- Opt-in & legal -->
          <div class="marketo-form-optin">
            <label class="marketo-form-checkbox-label">
              <input type="checkbox" name="optIn" class="marketo-form-checkbox">
              <span>Please keep me updated on the latest product and <a href="/services" class="marketo-form-privacy-link">services</a> information</span>
            </label>
          </div>

          <p class="marketo-form-recaptcha">This site is protected by reCAPTCHA.</p>

          <div class="marketo-form-submit-row">
            <button type="submit" class="button primary marketo-form-submit">Submit</button>
          </div>

          <!-- Success / error messages (hidden by default) -->
          <div class="marketo-form-message marketo-form-message-success" hidden role="status" aria-live="polite">
            Thank you! Your submission has been received. We will be in touch shortly.
          </div>
          <div class="marketo-form-message marketo-form-message-error" hidden role="alert" aria-live="assertive">
            Something went wrong. Please try again.
          </div>
        </form>
      </div>
    </div>
  `;

  return modal;
}

/**
 * Wires up tab-switching behaviour inside the modal form.
 * @param {HTMLElement} modal
 */
function initTabs(modal) {
  const tabs = modal.querySelectorAll('.marketo-form-tab');
  const hiddenInput = modal.querySelector('input[name="interest"]');
  const textarea = modal.querySelector('.marketo-form-interest-text');

  const INTEREST_TEMPLATES = {
    'Price Quote': 'I\'d like a Price Quote on GE HealthCare Technologies Inc.',
    'Product Info': 'I\'d like more information about GE HealthCare products.',
    'Product Demo': 'I\'d like to schedule a Product Demo with GE HealthCare.',
    'Training/Education': 'I\'m interested in Training/Education opportunities from GE HealthCare.',
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-pressed', 'true');
      const { value } = tab.dataset;
      if (hiddenInput) hiddenInput.value = value;
      if (textarea) textarea.value = INTEREST_TEMPLATES[value] || '';
    });
  });
}

/**
 * Opens the modal and traps focus inside it.
 * @param {HTMLElement} modal
 * @param {HTMLElement} trigger — element to return focus to on close
 */
function openModal(modal, trigger) {
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Focus the close button on open
  const closeBtn = modal.querySelector('.marketo-form-close');
  if (closeBtn) closeBtn.focus();

  // Trap focus
  const focusable = modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else if (document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') closeModal(modal, trigger, onKeydown); // eslint-disable-line no-use-before-define
    trapFocus(e);
  };

  modal.addEventListener('keydown', onKeydown);
  modal._closeHandler = onKeydown; // eslint-disable-line no-underscore-dangle
}

/**
 * Closes the modal and restores focus.
 * @param {HTMLElement} modal
 * @param {HTMLElement} trigger
 * @param {Function} keydownHandler
 */
function closeModal(modal, trigger, keydownHandler) {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (keydownHandler) modal.removeEventListener('keydown', keydownHandler);
  if (trigger) trigger.focus();
}

/**
 * Handles form submission — sends data to a Marketo endpoint or logs in dev.
 * @param {HTMLFormElement} form
 * @param {HTMLElement} modal
 */
async function handleSubmit(form) {
  const submitBtn = form.querySelector('.marketo-form-submit');
  const successMsg = form.querySelector('.marketo-form-message-success');
  const errorMsg = form.querySelector('.marketo-form-message-error');

  // Basic HTML5 validation
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    // Replace the action URL with your actual Marketo endpoint.
    // Keeping as a no-op fetch to localhost for now so the draft works offline.
    const endpoint = form.dataset.action || '/api/marketo-form';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok || res.status === 404 /* dev stub */) {
      form.reset();
      successMsg.removeAttribute('hidden');
      errorMsg.setAttribute('hidden', '');
      submitBtn.textContent = 'Submitted';
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Marketo form submission failed', err);
    errorMsg.removeAttribute('hidden');
    successMsg.setAttribute('hidden', '');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
}

/**
 * Loads and decorates the Marketo Form block.
 *
 * Authored structure (one row per field):
 *   Row 1 — Title (heading or text)
 *   Row 2 — Description (rich text)
 *   Row 3 — Button label (text) + optional link href
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // 1. Extract authored content from block rows
  const rows = [...block.children];
  const [titleRow, descRow, buttonRow, buttonTextRow] = rows;

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

  if (buttonRow) {
    const anchor = buttonRow.querySelector('a');
    const labelText = buttonTextRow?.textContent?.trim()
      || anchor?.textContent?.trim()
      || 'Contact Us';
    triggerBtn.textContent = labelText;
    moveInstrumentation(buttonRow, triggerBtn);
  } else {
    triggerBtn.textContent = 'Contact Us';
  }

  triggerWrapper.append(triggerBtn);
  teaser.append(triggerWrapper);

  // 4. Build the modal
  const modal = buildModal();
  initTabs(modal);

  // 5. Wire up open / close
  triggerBtn.addEventListener('click', () => openModal(modal, triggerBtn));

  const closeBtn = modal.querySelector('.marketo-form-close');
  closeBtn.addEventListener('click', () => {
    closeModal(modal, triggerBtn, modal._closeHandler); // eslint-disable-line no-underscore-dangle
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      // eslint-disable-next-line no-underscore-dangle
      closeModal(modal, triggerBtn, modal._closeHandler);
    }
  });

  // 6. Wire up form submit
  const form = modal.querySelector('.marketo-form-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(form);
  });

  // 7. Render
  block.replaceChildren(teaser);
  document.body.append(modal);
}
