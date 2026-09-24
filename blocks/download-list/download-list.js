import { moveInstrumentation } from '../../scripts/scripts.js';

const ICONS = {
  info: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-11h2v2h-2V9Zm0 4h2v6h-2v-6Z"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 0 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1ZM5 19h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>',
  external: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3a1 1 0 0 0 0 2h3.59l-8.3 8.3a1 1 0 0 0 1.42 1.4L19 6.42V10a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1h-6ZM5 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a1 1 0 0 0-2 0v6H5V7h6a1 1 0 0 0 0-2H5Z"/></svg>',
  // A "+" that becomes a "−" via CSS when the panel is expanded.
  toggle: '<svg class="download-list-toggle-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path class="download-list-toggle-v" fill="currentColor" d="M11 5h2v14h-2z"/><path fill="currentColor" d="M5 11h14v2H5z"/></svg>',
};

function getCellText(row, index) {
  const cell = row.children[index];
  return cell ? cell.textContent.trim() : '';
}

/** Builds a single download/external list item `<li>`. */
function buildItem(item) {
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

  if (item.info) {
    // Info as a hover/focus tooltip describing the item.
    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'download-list-icon download-list-icon-info';
    infoBtn.setAttribute('aria-label', `More information about ${item.label}`);
    infoBtn.innerHTML = ICONS.info;

    const tip = document.createElement('span');
    tip.className = 'download-list-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.textContent = item.info;

    const infoWrap = document.createElement('span');
    infoWrap.className = 'download-list-info';
    infoWrap.append(infoBtn, tip);
    actions.append(infoWrap);
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
  return li;
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
    // The group cell may encode an optional collapsible sub-group after a ">"
    // (e.g. "NGRGs & Observances > Observance assets"). Everything before the
    // ">" is the group heading; everything after is the sub-group label.
    const rawGroup = getCellText(row, 0);
    const sepIndex = rawGroup.indexOf('>');
    const group = (sepIndex === -1 ? rawGroup : rawGroup.slice(0, sepIndex)).trim();
    const subgroup = sepIndex === -1 ? '' : rawGroup.slice(sepIndex + 1).trim();
    // cell 1 is the collapsed file link (fileLink + fileLinkText) rendered as an anchor
    const labelAnchor = row.children[1] ? row.children[1].querySelector('a') : null;
    const label = labelAnchor ? labelAnchor.textContent.trim() : getCellText(row, 1);
    const fileLink = labelAnchor ? labelAnchor.getAttribute('href') : '';
    // fileLink + fileLinkText collapse into one anchor cell (index 1), so the
    // rendered cells are: group(0), link(1), kind(2), info(3).
    const kind = (getCellText(row, 2) || 'download').toLowerCase();
    const info = getCellText(row, 3);

    if (!groupIndex.has(group)) {
      groupIndex.set(group, groups.length);
      groups.push({ name: group, items: [] });
    }
    groups[groupIndex.get(group)].items.push({
      row, label, fileLink, kind, info, subgroup,
    });
  });

  const container = document.createElement('div');
  container.className = 'download-list-groups';

  let toggleSeq = 0;

  groups.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'download-list-group';

    const heading = document.createElement('h3');
    heading.className = 'download-list-heading';
    heading.textContent = group.name;
    groupEl.append(heading);

    // Split into always-visible items and named sub-groups (preserving order).
    // Items sharing a subgroup value collapse into one expandable panel.
    const topItems = group.items.filter((i) => !i.subgroup);
    const subOrder = [];
    const subMap = new Map();
    group.items.forEach((i) => {
      if (!i.subgroup) return;
      if (!subMap.has(i.subgroup)) {
        subMap.set(i.subgroup, []);
        subOrder.push(i.subgroup);
      }
      subMap.get(i.subgroup).push(i);
    });

    const body = document.createElement('div');
    body.className = 'download-list-body';

    if (topItems.length) {
      const list = document.createElement('ul');
      list.className = 'download-list-items';
      topItems.forEach((item) => list.append(buildItem(item)));
      body.append(list);
    }

    // Each sub-group renders as a collapsible +/− panel (default collapsed).
    subOrder.forEach((subName) => {
      toggleSeq += 1;
      const panelId = `download-list-panel-${toggleSeq}`;
      const sub = document.createElement('div');
      sub.className = 'download-list-subgroup';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'download-list-subgroup-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', panelId);
      toggle.innerHTML = `<span class="download-list-subgroup-title">${subName}</span><span class="download-list-toggle">${ICONS.toggle}</span>`;

      const panel = document.createElement('div');
      panel.className = 'download-list-subgroup-panel';
      panel.id = panelId;
      panel.hidden = true;

      const subList = document.createElement('ul');
      subList.className = 'download-list-items';
      subMap.get(subName).forEach((item) => subList.append(buildItem(item)));
      panel.append(subList);

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });

      sub.append(toggle, panel);
      body.append(sub);
    });

    groupEl.append(body);
    container.append(groupEl);
  });

  block.replaceChildren(container);
}
