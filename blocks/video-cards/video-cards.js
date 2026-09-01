import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const PLAY_ICON = '<svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>';
const ARROW_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4l4.29-4.3H4a1 1 0 0 1 0-2h13.59l-4.3-4.3a1 1 0 0 1 0-1.4Z"/></svg>';

function getCellText(row, index) {
  const cell = row.children[index];
  return cell ? cell.textContent.trim() : '';
}

function getCellImg(row, index) {
  const cell = row.children[index];
  return cell ? cell.querySelector('img') : null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const ul = document.createElement('ul');
  ul.className = 'video-cards-list';

  rows.forEach((row) => {
    const title = getCellText(row, 0);
    const caption = getCellText(row, 1);
    // cell 2 groups the (collapsed) link anchors; cell 3 is the image
    const linkAnchors = row.children[2] ? [...row.children[2].querySelectorAll('a')] : [];
    const link1Url = linkAnchors[0] ? linkAnchors[0].getAttribute('href') : '';
    const link1Text = linkAnchors[0] ? linkAnchors[0].textContent.trim() : '';
    const link2Url = linkAnchors[1] ? linkAnchors[1].getAttribute('href') : '';
    const link2Text = linkAnchors[1] ? linkAnchors[1].textContent.trim() : '';
    const img = getCellImg(row, 3);

    const li = document.createElement('li');
    li.className = 'video-cards-card';
    moveInstrumentation(row, li);

    // Media tile (links to link1Url when available)
    const tile = document.createElement(link1Url ? 'a' : 'div');
    tile.className = 'video-cards-tile';
    if (link1Url) {
      tile.href = link1Url;
      tile.setAttribute('aria-label', title || link1Text || 'Watch video');
    }

    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt || title, false, [{ width: '750' }]);
      optimizedPic.classList.add('video-cards-tile-image');
      tile.append(optimizedPic);
      tile.classList.add('video-cards-tile-has-image');
    }

    const play = document.createElement('span');
    play.className = 'video-cards-play';
    play.innerHTML = PLAY_ICON;
    tile.append(play);

    if (title) {
      const tileTitle = document.createElement('span');
      tileTitle.className = 'video-cards-tile-title';
      tileTitle.textContent = title;
      tile.append(tileTitle);
    }

    const wordmark = document.createElement('span');
    wordmark.className = 'video-cards-wordmark';
    wordmark.textContent = 'GE HealthCare';
    tile.append(wordmark);

    li.append(tile);

    // Body: caption + links
    const body = document.createElement('div');
    body.className = 'video-cards-body';

    if (caption) {
      const captionEl = document.createElement('p');
      captionEl.className = 'video-cards-caption';
      captionEl.textContent = caption;
      body.append(captionEl);
    }

    const links = [
      { text: link1Text, url: link1Url },
      { text: link2Text, url: link2Url },
    ].filter((l) => l.url);

    if (links.length) {
      const linksEl = document.createElement('div');
      linksEl.className = 'video-cards-links';
      links.forEach((l) => {
        const a = document.createElement('a');
        a.className = 'video-cards-link';
        a.href = l.url;
        a.innerHTML = `<span>${l.text || 'View'}</span>${ARROW_ICON}`;
        linksEl.append(a);
      });
      body.append(linksEl);
    }

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
