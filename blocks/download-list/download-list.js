import { moveInstrumentation } from '../../scripts/scripts.js';

const ICONS = {
  info: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-11h2v2h-2V9Zm0 4h2v6h-2v-6Z"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 0 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1ZM5 19h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>',
  external: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3a1 1 0 0 0 0 2h3.59l-8.3 8.3a1 1 0 0 0 1.42 1.4L19 6.42V10a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1h-6ZM5 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a1 1 0 0 0-2 0v6H5V7h6a1 1 0 0 0 0-2H5Z"/></svg>',
};

function getCellText(row, index) {
  const cell = row.children[index];
  return cell ? cell.textContent.trim() : '';
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const groups = [];
  const groupIndex = new Map();

  rows.forEach((row) => {
    const group = getCellText(row, 0);
    // cell 1 is the collapsed file link (fileLink + fileLinkText) rendered as an anchor
    const labelAnchor = row.children[1] ? row.children[1].querySelector('a') : null;
    const label = labelAnchor ? labelAnchor.textContent.trim() : getCellText(row, 1);
    const fileLink = labelAnchor ? labelAnchor.getAttribute('href') : '';
    const infoLink = getCellText(row, 2);
    const kind = (getCellText(row, 3) || 'download').toLowerCase();

    if (!groupIndex.has(group)) {
      groupIndex.set(group, groups.length);
      groups.push({ name: group, items: [] });
    }
    groups[groupIndex.get(group)].items.push({
      row, label, infoLink, fileLink, kind,
    });
  });

  const container = document.createElement('div');
  container.className = 'download-list-groups';

  groups.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'download-list-group';

    const heading = document.createElement('h3');
    heading.className = 'download-list-heading';
    heading.textContent = group.name;
    groupEl.append(heading);

    const list = document.createElement('ul');
    list.className = 'download-list-items';

    group.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'download-list-item';
      moveInstrumentation(item.row, li);

      const labelLink = document.createElement('a');
      labelLink.className = 'download-list-label';
      labelLink.textContent = item.label;
      if (item.fileLink) {
        labelLink.href = item.fileLink;
        if (item.kind === 'external') {
          labelLink.target = '_blank';
          labelLink.rel = 'noopener noreferrer';
        }
      }
      li.append(labelLink);

      const actions = document.createElement('span');
      actions.className = 'download-list-actions';

      if (item.infoLink) {
        const infoAnchor = document.createElement('a');
        infoAnchor.className = 'download-list-icon download-list-icon-info';
        infoAnchor.href = item.infoLink;
        infoAnchor.setAttribute('aria-label', `More information about ${item.label}`);
        infoAnchor.innerHTML = ICONS.info;
        actions.append(infoAnchor);
      }

      if (item.fileLink) {
        const fileAnchor = document.createElement('a');
        const isExternal = item.kind === 'external';
        fileAnchor.className = `download-list-icon download-list-icon-${isExternal ? 'external' : 'download'}`;
        fileAnchor.href = item.fileLink;
        if (isExternal) {
          fileAnchor.target = '_blank';
          fileAnchor.rel = 'noopener noreferrer';
          fileAnchor.setAttribute('aria-label', `Open ${item.label} in a new tab`);
          fileAnchor.innerHTML = ICONS.external;
        } else {
          fileAnchor.setAttribute('aria-label', `Download ${item.label}`);
          fileAnchor.innerHTML = ICONS.download;
        }
        actions.append(fileAnchor);
      }

      li.append(actions);
      list.append(li);
    });

    groupEl.append(list);
    container.append(groupEl);
  });

  block.replaceChildren(container);
}
