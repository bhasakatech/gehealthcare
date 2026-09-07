#!/usr/bin/env python3
"""Build search-suggestions.json for the header search typeahead.

The live site shows, as you type in the header search box, a dropdown with:
  - "Suggested Keywords": short phrases derived from page/section titles
  - "Quick Links": nav entries, each tagged Page (top-level link) or by its
    parent section name (anchor link), linking straight to the page/section.

This mirrors that by reading the shared Section Nav (from legal.xml — the same
nav used site-wide) plus the asset feed for keyword coverage. Served from the
repo root as /search-suggestions.json (code bus), like search-assets.json.

Run: python3 tools/importer/build-search-suggestions.py
"""
import re
import html
import json

NAV_SRC = 'migration-work/jcr-content/legal.xml'
ASSETS = 'search-assets.json'
OUT = 'search-suggestions.json'


def unescape(s):
    return html.unescape(s.replace('&#x3D;', '=').replace('&#x3d;', '='))


def strip_trailing_slash(href):
    if not href.startswith('/'):
        return href
    hash_i = href.find('#')
    path = href if hash_i == -1 else href[:hash_i]
    frag = '' if hash_i == -1 else href[hash_i:]
    path = path.rstrip('/') or '/'
    return path + frag


def nav_items():
    txt = open(NAV_SRC, encoding='utf-8').read()
    items = []
    for it in re.findall(r'<item_\d+[^>]*model="section-nav-item"[^>]*>', txt):
        def g(f):
            m = re.search(f'{f}="([^"]*)"', it)
            return unescape(m.group(1)) if m else ''
        items.append({'title': g('title'), 'link': g('link'), 'parent': g('parent')})
    return items


def main():
    items = nav_items()

    # Quick Links: top-level (no parent) => "Page"; anchor/child => parent name.
    quicklinks = []
    for it in items:
        if not it['title'] or not it['link']:
            continue
        kind = it['parent'] if it['parent'] else 'Page'
        quicklinks.append({
            'title': it['title'],
            'link': strip_trailing_slash(it['link']),
            'type': kind,
        })

    # Suggested Keywords: distinct lowercased nav titles + a few asset-derived
    # phrases, de-duplicated, kept short.
    seen = set()
    keywords = []
    for it in items:
        t = it['title'].strip()
        key = t.lower()
        if t and key not in seen and len(t) <= 40:
            seen.add(key)
            keywords.append(t)

    try:
        assets = json.load(open(ASSETS, encoding='utf-8'))['data']
        for a in assets:
            t = re.sub(r'\s*\(.*?\)\s*$', '', a.get('title', '')).strip()
            key = t.lower()
            if t and key not in seen and len(t) <= 40:
                seen.add(key)
                keywords.append(t)
    except FileNotFoundError:
        pass

    data = [{'keyword': k} for k in keywords]
    payload = {
        'total': len(data),
        'offset': 0,
        'limit': len(data),
        ':type': 'multi-sheet',
        ':names': ['keywords', 'quicklinks'],
        'keywords': {'total': len(keywords), 'offset': 0, 'limit': len(keywords),
                     'data': [{'keyword': k} for k in keywords]},
        'quicklinks': {'total': len(quicklinks), 'offset': 0, 'limit': len(quicklinks),
                       'data': quicklinks},
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f'Wrote {OUT} ({len(keywords)} keywords, {len(quicklinks)} quick links)')


if __name__ == '__main__':
    main()
