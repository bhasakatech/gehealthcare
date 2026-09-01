import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero — the homepage top banner.
 *
 * A full-bleed background (autoplaying looping video when a video URL is
 * provided, otherwise an image) with a dark overlay, centered eyebrow + heading
 * content, and a "Explore the brand" scroll/CTA link at the bottom.
 *
 * Authored cells: [image, video, text(eyebrow + h1), cta, ctaText].
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstRowCells = rows[0] ? [...rows[0].children] : [];
  // Support a single multi-cell row or stacked single-cell rows.
  const cells = firstRowCells.length > 1
    ? firstRowCells
    : rows.map((row) => row.firstElementChild || row);

  const [imageCell, videoCell, textCell, ctaCell, ctaTextCell] = cells;

  // --- Background media (video takes precedence) ---
  const bg = document.createElement('div');
  bg.className = 'hero-bg';

  const videoAnchor = videoCell?.querySelector('a');
  const videoUrl = videoAnchor?.getAttribute('href')
    || (videoCell?.textContent.trim().match(/\.mp4($|\?)/i) ? videoCell.textContent.trim() : '');
  const img = imageCell?.querySelector('img');

  if (videoUrl) {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.setAttribute('preload', 'auto');
    video.setAttribute('aria-hidden', 'true');
    const source = document.createElement('source');
    source.src = videoUrl;
    source.type = 'video/mp4';
    video.append(source);
    bg.append(video);
  } else if (img) {
    const optimized = createOptimizedPicture(img.src, img.alt || '', true, [{ width: '2000' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    bg.append(optimized);
  }

  // --- Content (eyebrow + heading) ---
  const content = document.createElement('div');
  content.className = 'hero-content';
  if (textCell) {
    moveInstrumentation(rows[0], content);
    while (textCell.firstChild) content.append(textCell.firstChild);
  }
  // Tag the first paragraph before the H1 as an eyebrow, if present.
  const h1 = content.querySelector('h1');
  if (h1) {
    const prev = h1.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) prev.classList.add('hero-eyebrow');
  }

  // --- CTA / scroll link ---
  const ctaAnchor = ctaCell?.querySelector('a');
  const ctaHref = ctaAnchor?.getAttribute('href') || ctaCell?.textContent.trim() || '';
  const ctaLabel = (ctaTextCell?.textContent.trim())
    || ctaAnchor?.textContent.trim()
    || 'Explore the brand';
  if (ctaHref) {
    const cta = document.createElement('a');
    cta.className = 'hero-cta';
    cta.href = ctaHref;
    cta.innerHTML = `<span>${ctaLabel}</span>`;
    content.append(cta);
  }

  block.replaceChildren(bg, content);
}
