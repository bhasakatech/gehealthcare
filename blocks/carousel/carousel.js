import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_INTERVAL = 5000;

/**
 * Scrolls the track so the slide at the given index is aligned to the start.
 * @param {Element} track The scroll-snap track
 * @param {number} index The slide index to show
 */
function scrollToSlide(track, index) {
  const slides = [...track.children];
  const clamped = Math.max(0, Math.min(index, slides.length - 1));
  const target = slides[clamped];
  if (target) {
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }
}

/**
 * Determines which slide is currently the most visible in the track.
 * @param {Element} track The scroll-snap track
 * @returns {number} The active slide index
 */
function getActiveIndex(track) {
  const slides = [...track.children];
  const trackLeft = track.scrollLeft;
  let closest = 0;
  let closestDistance = Infinity;
  slides.forEach((slide, i) => {
    const distance = Math.abs((slide.offsetLeft - track.offsetLeft) - trackLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = i;
    }
  });
  return closest;
}

export default function decorate(block) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 3. Transform DOM
  const track = document.createElement('div');
  track.className = 'carousel-track';

  const slides = [...block.children];
  slides.forEach((row, i) => {
    const cells = [...row.children];
    const [imageCell, altCell, linkCell] = cells;

    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    moveInstrumentation(row, slide);

    const img = imageCell?.querySelector('img');
    const altText = altCell?.textContent.trim() || img?.alt || '';
    const linkHref = linkCell?.querySelector('a')?.href || linkCell?.textContent.trim() || '';

    let media = document.createElement('div');
    media.className = 'carousel-slide-image';
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, altText, false, [{ width: '1200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      media.append(optimizedPic);
    }

    if (linkHref) {
      const anchor = document.createElement('a');
      anchor.href = linkHref;
      anchor.className = 'carousel-slide-link';
      if (altText) anchor.setAttribute('aria-label', altText);
      anchor.append(media);
      media = anchor;
    }
    slide.append(media);

    if (altText) {
      const caption = document.createElement('p');
      caption.className = 'carousel-slide-caption';
      caption.textContent = altText;
      slide.append(caption);
    }

    track.append(slide);
  });

  const container = document.createElement('div');
  container.className = 'carousel-container';
  container.setAttribute('role', 'group');
  container.setAttribute('aria-roledescription', 'carousel');
  container.setAttribute('aria-label', 'Image carousel');
  container.append(track);

  // Navigation buttons
  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'carousel-nav carousel-nav-prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.innerHTML = '<span aria-hidden="true">‹</span>';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'carousel-nav carousel-nav-next';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.innerHTML = '<span aria-hidden="true">›</span>';

  container.append(prevButton, nextButton);

  // Dots indicator
  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose slide to display');
  const dotButtons = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => scrollToSlide(track, i));
    dots.append(dot);
    return dot;
  });

  const setActive = (index) => {
    dotButtons.forEach((dot, i) => {
      const selected = i === index;
      dot.classList.toggle('active', selected);
      dot.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };
  setActive(0);

  container.append(dots);
  block.replaceChildren(container);

  // 4. Add event listeners
  prevButton.addEventListener('click', () => scrollToSlide(track, getActiveIndex(track) - 1));
  nextButton.addEventListener('click', () => scrollToSlide(track, getActiveIndex(track) + 1));

  let scrollTimeout;
  track.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => setActive(getActiveIndex(track)), 100);
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToSlide(track, getActiveIndex(track) - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToSlide(track, getActiveIndex(track) + 1);
    }
  });

  // Optional autoplay: respects reduced motion, pauses on hover/focus
  if (!prefersReducedMotion && slides.length > 1) {
    let timer;
    const advance = () => {
      const current = getActiveIndex(track);
      const next = current >= slides.length - 1 ? 0 : current + 1;
      scrollToSlide(track, next);
    };
    const start = () => {
      timer = window.setInterval(advance, AUTOPLAY_INTERVAL);
    };
    const stop = () => window.clearInterval(timer);
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', start);
    container.addEventListener('focusin', stop);
    container.addEventListener('focusout', start);
    start();
  }
}
