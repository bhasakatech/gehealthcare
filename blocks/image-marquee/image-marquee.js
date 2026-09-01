import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Image Marquee — a continuously scrolling row of images.
 *
 * Mirrors the source site's Avada "awb-carousel--marquee" (data-marquee-direction
 * left, autoplay, loop): images scroll seamlessly to the left forever. To make
 * the loop seamless we duplicate the authored set once, then translate the track
 * by -50% over a CSS animation.
 *
 * Authored structure (see _image-marquee.json): one row per slide, each with a
 * single image cell.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'image-marquee-track';

  const slides = [];
  [...block.children].forEach((row) => {
    const img = row.querySelector('img');
    if (!img) return;
    const li = document.createElement('li');
    li.className = 'image-marquee-item';
    moveInstrumentation(row, li);
    const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
    li.append(optimized);
    slides.push(li);
    track.append(li);
  });

  if (!slides.length) {
    block.textContent = '';
    return;
  }

  // Duplicate the slide set for a seamless infinite loop (clones are decorative,
  // so hide them from assistive tech).
  slides.forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
  });

  // Pace the animation by slide count so speed stays consistent regardless of
  // how many images the author adds (~4s per slide).
  track.style.setProperty('--image-marquee-duration', `${slides.length * 4}s`);

  const viewport = document.createElement('div');
  viewport.className = 'image-marquee-viewport';
  viewport.append(track);

  block.textContent = '';
  block.append(viewport);

  // Pause on hover/focus for usability.
  block.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
  block.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  block.addEventListener('focusin', () => { track.style.animationPlayState = 'paused'; });
  block.addEventListener('focusout', () => { track.style.animationPlayState = 'running'; });
}
