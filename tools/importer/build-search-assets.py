#!/usr/bin/env python3
"""Build /search-assets.json from the authored Downloads, Guidelines and Learn JCR.

The search-results block groups results into "Pages and sections" (from
query-index.json) plus asset categories — Downloads, Guidelines and Training and
learning — that are NOT pages but files hosted on assets.gehealthcare.com. Those
live inside the download-list (Downloads, Guidelines) and video-cards (Learn)
blocks, so we extract them here into one EDS-style JSON feed the block fetches
alongside the page index.

Re-run whenever the Downloads / Guidelines / Learn pages change:
  python3 tools/importer/build-search-assets.py

Writes: search-assets.json (repo root — committed and served from the code bus,
so it deploys via git without an AEM-author upload).
"""
import re
import html
import json

JCR = 'migration-work/jcr-content'
OUT = 'search-assets.json'


def unescape(s):
    return html.unescape(s.replace('&#x3D;', '=').replace('&#x3d;', '='))


def file_type(url):
    m = re.search(r'\.(zip|pdf|pptx|ppt|docx|doc|xlsx)(\b|$|\?|&)', url, re.I)
    if m:
        return m.group(1).upper()
    if 'action=download' in url:
        return 'ZIP'
    return 'FILE'


def attr(item, field):
    m = re.search(f'{field}="([^"]*)"', item)
    return unescape(m.group(1)) if m else ''


def download_items(path, category):
    txt = open(path, encoding='utf-8').read()
    out = []
    for it in re.findall(r'<item_\d+[^>]*model="download-item"[^>]*>', txt):
        url = attr(it, 'fileLink')
        title = attr(it, 'fileLinkText')
        if url and title:
            out.append({
                'title': title,
                'url': url,
                'category': category,
                'fileType': file_type(url),
                'description': attr(it, 'info'),
            })
    return out


def video_cards(path, category):
    txt = open(path, encoding='utf-8').read()
    out = []
    for it in re.findall(r'<item_\d+[^>]*model="video-card"[^>]*>', txt):
        title = attr(it, 'title')
        if not title:
            continue
        out.append({
            'title': title,
            'url': attr(it, 'links_link1'),
            'category': category,
            'fileType': 'VIDEO',
            'description': attr(it, 'caption'),
            'presentation': attr(it, 'links_link2'),
            'guideline': attr(it, 'links_link3'),
        })
    return out


def main():
    data = []
    data += download_items(f'{JCR}/downloads.xml', 'download')
    data += download_items(f'{JCR}/guidelines.xml', 'guideline')
    data += video_cards(f'{JCR}/learn.xml', 'training')

    payload = {
        'total': len(data),
        'offset': 0,
        'limit': len(data),
        'data': data,
        ':type': 'sheet',
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f'Wrote {OUT} ({len(data)} assets)')


if __name__ == '__main__':
    main()
