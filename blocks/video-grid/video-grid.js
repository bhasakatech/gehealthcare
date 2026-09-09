import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const LAYOUT_CLASSES = [
  'columns-1', 'columns-2', 'columns-3',
  'layout-video-text', 'layout-text-video', 'layout-video-only', 'layout-none',
];

/** Reads a video URL from a cell (linked MP4 or plain .mp4 path). */
function getVideoUrl(cell) {
  if (!cell) return '';
  const anchor = cell.querySelector('a');
  if (anchor?.getAttribute('href')) return anchor.getAttribute('href');
  const text = cell.textContent.trim();
  return /\.mp4($|\?)/i.test(text) ? text : '';
}

/** Builds a muted, looping, inline video with optional poster. */
function buildVideo(url, poster) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.loop = true;
  video.controls = true;
  video.setAttribute('preload', 'metadata');
  if (poster?.src) video.setAttribute('poster', poster.src);
  const source = document.createElement('source');
  source.src = url;
  source.type = 'video/mp4';
  video.append(source);
  return video;
}

/**
 * loads and decorates the block
 *
 * Renders videos in a grid (1/2/3 columns) or a side-by-side video+text layout.
 * Layout comes from the authored class. Each item: [video, poster, caption, text].
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const ul = document.createElement('ul');
  ul.className = 'video-grid-list';

  rows.forEach((row) => {
    const [videoCell, posterCell, captionCell, textCell] = [...row.children];
    const videoUrl = getVideoUrl(videoCell);
    const poster = posterCell?.querySelector('img') || null;
    const caption = captionCell?.textContent.trim() || '';

    const li = document.createElement('li');
    li.className = 'video-grid-item';
    moveInstrumentation(row, li);

    // Media (video, or poster image fallback)
    const media = document.createElement('div');
    media.className = 'video-grid-media';
    if (videoUrl) {
      media.append(buildVideo(videoUrl, poster));
    } else if (poster) {
      media.append(createOptimizedPicture(poster.src, poster.alt || '', false, [{ width: '750' }]));
    }
    li.append(media);

    if (caption) {
      const cap = document.createElement('p');
      cap.className = 'video-grid-caption';
      cap.textContent = caption;
      li.append(cap);
    }

    // Optional text (used by the video+text layouts)
    if (textCell && textCell.textContent.trim()) {
      const text = document.createElement('div');
      text.className = 'video-grid-text';
      while (textCell.firstChild) text.append(textCell.firstChild);
      li.append(text);
    }

    ul.append(li);
  });

  // Default to 3 columns when the author hasn't chosen a layout.
  if (!LAYOUT_CLASSES.some((c) => block.classList.contains(c))) {
    block.classList.add('columns-3');
  }

  block.replaceChildren(ul);
}
