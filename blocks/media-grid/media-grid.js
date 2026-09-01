import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Media Grid — the brand-foundations landing grid.
 *
 * A 2-column grid of tiles; each tile is a large title above a media block
 * (autoplaying looping video when a video URL is present, otherwise an image).
 * The whole tile links to the target topic page. No description or CTA text —
 * just title + media (matches the live brand-foundations design).
 *
 * Authored cells per row: [title, image, video, link].
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'media-grid-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [titleCell, imageCell, videoCell, linkCell] = cells;

    const li = document.createElement('li');
    li.className = 'media-tile';
    moveInstrumentation(row, li);

    const linkAnchor = linkCell?.querySelector('a');
    const href = linkAnchor?.getAttribute('href') || (linkCell?.textContent.trim() || '');

    // Title (rendered as a heading link)
    const titleText = titleCell?.textContent.trim() || '';
    if (titleText) {
      const h = document.createElement('h3');
      h.className = 'media-tile-title';
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h.append(a);
      } else {
        h.textContent = titleText;
      }
      li.append(h);
    }

    // Media tile (video takes precedence over image)
    const media = document.createElement('div');
    media.className = 'media-tile-media';

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
      const optimized = createOptimizedPicture(img.src, img.alt || titleText, false, [{ width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
    }

    // Make the media clickable to the topic page
    if (href) {
      const mediaLink = document.createElement('a');
      mediaLink.className = 'media-tile-link';
      mediaLink.href = href;
      mediaLink.setAttribute('aria-label', titleText);
      mediaLink.setAttribute('tabindex', '-1');
      mediaLink.append(...media.childNodes);
      media.append(mediaLink);
    }
    li.append(media);

    ul.append(li);
  });

  block.replaceChildren(ul);
}
