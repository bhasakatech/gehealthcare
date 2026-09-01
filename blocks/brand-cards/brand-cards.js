import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Brand Cards — the homepage "Core brand elements" 3-column grid.
 *
 * Each card has a media element (an autoplaying looping video when a video URL
 * is provided, otherwise an image), a title + description, and a "Learn more"
 * link. The whole card links to the target brand-foundation page.
 *
 * Authored cells per row: [image, video, text(h3 + p), cardLink, cardLinkText].
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'brand-cards-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [imageCell, videoCell, textCell, linkCell, linkTextCell] = cells;

    const li = document.createElement('li');
    li.className = 'brand-card';
    moveInstrumentation(row, li);

    // Resolve the card link (used for the media anchor and the button).
    const linkAnchor = linkCell?.querySelector('a');
    const href = linkAnchor?.getAttribute('href')
      || (linkCell?.textContent.trim() || '');

    // --- Media (video takes precedence over image) ---
    const media = document.createElement('div');
    media.className = 'brand-card-media';

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
      media.append(video);
    } else if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
    }

    // Make the media clickable to the card target.
    if (href) {
      const mediaLink = document.createElement('a');
      mediaLink.className = 'brand-card-media-link';
      mediaLink.href = href;
      mediaLink.setAttribute('tabindex', '-1');
      mediaLink.setAttribute('aria-hidden', 'true');
      mediaLink.append(...media.childNodes);
      media.append(mediaLink);
    }
    li.append(media);

    // --- Body: title + description ---
    const body = document.createElement('div');
    body.className = 'brand-card-body';
    if (textCell) {
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
    }

    // --- "Learn more" link (collapsed link+text: anchor href = link, text = label) ---
    if (href) {
      const cta = document.createElement('a');
      cta.className = 'brand-card-cta';
      cta.href = href;
      const anchorText = linkAnchor?.textContent.trim();
      const label = (linkTextCell?.textContent.trim())
        || (anchorText && anchorText !== href ? anchorText : '')
        || 'Learn more';
      cta.innerHTML = `<span>${label}</span>`;
      body.append(cta);
    }

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
