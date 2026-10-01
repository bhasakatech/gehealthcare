import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds the modal overlay and dialog with the GE HealthCare contact form.
 * @returns {HTMLElement} The modal element
 */
function buildModal() {
  const modal = document.createElement('div');
  modal.className = 'contact-form-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'contact-form-dialog-title');
  modal.setAttribute('hidden', '');

  modal.innerHTML = `
    <div class="contact-form-dialog">
      <button class="contact-form-close" aria-label="Close dialog" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="contact-form-dialog-body">
        <h2 id="contact-form-dialog-title">
          Have a question?
          <span class="contact-form-title-accent"> We would love to hear from you.</span>
        </h2>

        <form class="contact-form-form" novalidate>
          <!-- Interest tabs -->
          <fieldset class="contact-form-fieldset">
            <legend class="contact-form-legend">What can we help you with?</legend>
            <div class="contact-form-tabs" role="group" aria-label="Interest type">
              <button type="button" class="contact-form-tab is-active" data-value="Price Quote">Price Quote</button>
              <button type="button" class="contact-form-tab" data-value="Product Info">Product Info</button>
              <button type="button" class="contact-form-tab" data-value="Product Demo">Product Demo</button>
              <button type="button" class="contact-form-tab" data-value="Training/Education">Training/Education</button>
            </div>
            <input type="hidden" name="interest" value="Price Quote">
            <textarea
              class="contact-form-interest-text"
              name="interestDetail"
              aria-label="Tell us more about your interest"
              rows="4"
            >I'd like a Price Quote on GE HealthCare Technologies Inc.</textarea>
          </fieldset>

          <!-- Contact info -->
          <fieldset class="contact-form-fieldset">
            <legend class="contact-form-legend">
              Who should we contact?
              <span class="contact-form-legend-sub">
                Your privacy matters, <a href="/privacy-policy" class="contact-form-privacy-link">learn</a> about our <a href="/privacy-policy" class="contact-form-privacy-link">privacy policy</a>.
              </span>
            </legend>
            <div class="contact-form-row">
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-firstname">
                  First Name<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="contact-firstname" name="firstName" class="contact-form-input" required autocomplete="given-name">
              </div>
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-lastname">
                  Last Name<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="contact-lastname" name="lastName" class="contact-form-input" required autocomplete="family-name">
              </div>
            </div>
            <div class="contact-form-row">
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-email">
                  Email<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="email" id="contact-email" name="email" class="contact-form-input" required autocomplete="email">
              </div>
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-phone">Phone Number:</label>
                <input type="tel" id="contact-phone" name="phone" class="contact-form-input" autocomplete="tel">
              </div>
            </div>
          </fieldset>

          <!-- Work info -->
          <fieldset class="contact-form-fieldset">
            <legend class="contact-form-legend">
              Where do you work?
              <span class="contact-form-legend-sub contact-form-legend-sub-accent">
                This helps us direct you to the right specialist
              </span>
            </legend>
            <div class="contact-form-row">
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-country">
                  Country<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <div class="contact-form-select-wrapper">
                  <select id="contact-country" name="country" class="contact-form-select" required autocomplete="country">
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
                  <span class="contact-form-select-arrow" aria-hidden="true">&#8964;</span>
                </div>
              </div>
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-zip">
                  Zip/Postal Code<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="contact-zip" name="zip" class="contact-form-input" required autocomplete="postal-code">
              </div>
            </div>
            <div class="contact-form-row">
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-company">
                  Company Name:<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="contact-company" name="company" class="contact-form-input" required autocomplete="organization">
              </div>
              <div class="contact-form-field">
                <label class="contact-form-label" for="contact-jobtitle">
                  Job Title<span class="contact-form-required" aria-hidden="true">*</span>
                </label>
                <input type="text" id="contact-jobtitle" name="jobTitle" class="contact-form-input" required autocomplete="organization-title">
              </div>
            </div>
          </fieldset>

          <!-- Opt-in & legal -->
          <div class="contact-form-optin">
            <label class="contact-form-checkbox-label">
              <input type="checkbox" name="optIn" class="contact-form-checkbox">
              <span>Please keep me updated on the latest product and <a href="/services" class="contact-form-privacy-link">services</a> information</span>
            </label>
          </div>

          <p class="contact-form-recaptcha">This site is protected by reCAPTCHA.</p>

          <div class="contact-form-submit-row">
            <button type="submit" class="button primary contact-form-submit">Submit</button>
          </div>

          <!-- Success / error messages (hidden by default) -->
          <div class="contact-form-message contact-form-message-success" hidden role="status" aria-live="polite">
            Thank you! Your submission has been received. We will be in touch shortly.
          </div>
          <div class="contact-form-message contact-form-message-error" hidden role="alert" aria-live="assertive">
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
  const tabs = modal.querySelectorAll('.contact-form-tab');
  const hiddenInput = modal.querySelector('input[name="interest"]');
  const textarea = modal.querySelector('.contact-form-interest-text');

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
  const closeBtn = modal.querySelector('.contact-form-close');
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
  const submitBtn = form.querySelector('.contact-form-submit');
  const successMsg = form.querySelector('.contact-form-message-success');
  const errorMsg = form.querySelector('.contact-form-message-error');

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
 * Loads and decorates the Contact Form block.
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
  const [titleRow, descRow, buttonRow] = rows;

  // 2. Build the teaser section
  const teaser = document.createElement('div');
  teaser.className = 'contact-form-teaser';

  if (titleRow) {
    const titleEl = document.createElement('div');
    titleEl.className = 'contact-form-teaser-title';
    moveInstrumentation(titleRow, titleEl);
    while (titleRow.firstElementChild?.firstChild) {
      titleEl.append(titleRow.firstElementChild.firstChild);
    }
    teaser.append(titleEl);
  }

  if (descRow) {
    const descEl = document.createElement('div');
    descEl.className = 'contact-form-teaser-desc';
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
  triggerBtn.className = 'button primary contact-form-trigger';

  if (buttonRow) {
    const anchor = buttonRow.querySelector('a');
    triggerBtn.textContent = anchor
      ? anchor.textContent.trim()
      : buttonRow.textContent.trim() || 'Contact Us';
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

  const closeBtn = modal.querySelector('.contact-form-close');
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
  const form = modal.querySelector('.contact-form-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(form);
  });

  // 7. Render
  block.replaceChildren(teaser);
  document.body.append(modal);
}
