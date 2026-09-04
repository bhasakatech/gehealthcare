#!/usr/bin/env python3
"""Render authored JCR content XML into content/**.plain.html.

The local `aem up` dev server serves content/**.plain.html (with
--prefer-plain-html). This regenerates that file deterministically from the
authored JCR (migration-work/jcr-content/**.xml) so the local preview reflects
hand-authored/edited JCR without a live re-scrape.

Walks the <section> children in document order and emits the same block markup
the importer produces (block class = filter/model/name; one <div> row per field;
items become extra rows). The section style becomes a trailing section-metadata.

Usage: python3 tools/importer/jcr-to-plainhtml.py <jcr.xml> <out.plain.html>
"""
import re
import sys
import xml.etree.ElementTree as ET


def local(tag):
    return tag.split('}', 1)[-1] if '}' in tag else tag.split(':', 1)[-1]


def decode_rich(s):
    if not s:
        return ''
    # ElementTree already decodes &lt; &gt; &amp; &quot;; only the numeric
    # equals sign the authoring layer emits (&#x3D;) needs undoing.
    return s.replace('&#x3D;', '=').replace('&#x3d;', '=')


def slug(title):
    t = title.lower()
    t = re.sub(r"[’']", '', t)
    t = re.sub(r'&[a-z]+;', ' ', t)
    t = re.sub(r'[^a-z0-9]+', '-', t)
    return t.strip('-')


def picture(src, alt=''):
    if not src:
        return ''
    alt_attr = f' alt="{alt}"' if alt else ''
    return f'<picture><img src="{src}"{alt_attr}></picture>'


def cell(inner):
    return f'        \n            <div>{inner}</div>\n        '


def rows(cells):
    return '\n'.join(f'    <div>\n{cell(c)}\n    </div>' for c in cells)


def block(cls, cells):
    return f'<div class="{cls}">\n{rows(cells)}\n\n</div>'


def item_block(cls, items, fields):
    body = []
    for it in items:
        cs = []
        for f in fields:
            kind = f.get('type')
            name = f['name']
            val = it.get(name, '')
            if kind == 'image':
                cs.append(picture(val, it.get('imageAlt', '')))
            elif kind == 'link':
                cs.append(f'<a href="{val}">{val}</a>' if val else '')
            else:
                cs.append(decode_rich(val))
        body.append('    <div>\n' + '\n'.join(cell(c) for c in cs) + '\n    </div>')
    return f'<div class="{cls}">\n' + '\n'.join(body) + '\n\n</div>'


def children(node):
    return list(node)


def main():
    if len(sys.argv) != 3:
        sys.exit('Usage: python3 tools/importer/jcr-to-plainhtml.py <jcr.xml> <out.plain.html>')
    in_path, out_path = sys.argv[1], sys.argv[2]
    tree = ET.parse(in_path)
    jcr_root = tree.getroot()
    jcr_content = next(c for c in children(jcr_root) if local(c.tag) == 'content')
    root_el = next(c for c in children(jcr_content) if local(c.tag) == 'root')
    section = next(c for c in children(root_el) if local(c.tag) == 'section')
    section_style = re.sub(r'^\[|\]$', '', section.get('style', ''))

    out = ['<div>']
    for node in children(section):
        name = local(node.tag)
        a = node.attrib
        if name.startswith('text'):
            out.append(decode_rich(a.get('text', '')))
        elif name.startswith('title'):
            t = a.get('title', '')
            tt = a.get('titleType', 'h2')
            out.append(f'<{tt} id="{slug(t)}">{t}</{tt}>')
        elif name.startswith('image'):
            out.append(f'<p>{picture(a.get("image", ""), a.get("imageAlt", ""))}</p>')
        elif name.startswith('button'):
            out.append(f'<p><a href="{a.get("link", "")}">{decode_rich(a.get("linkText", ""))}</a></p>')
        elif name.startswith('block'):
            flt = a.get('filter', '')
            model = a.get('model', '')
            if flt == 'section-nav':
                items = [dict(c.attrib) for c in children(node) if local(c.tag).startswith('item')]
                out.append(item_block('section-nav', items, [
                    {'name': 'title'}, {'name': 'link', 'type': 'link'}, {'name': 'parent'}]))
            elif flt == 'dos-donts':
                items = [dict(c.attrib) for c in children(node) if local(c.tag).startswith('item')]
                out.append(item_block('dos-donts', items, [
                    {'name': 'status'}, {'name': 'image', 'type': 'image'},
                    {'name': 'example'}, {'name': 'caption'}]))
            elif model == 'content-media':
                out.append(block('content-media', [
                    decode_rich(a.get('text', '')),
                    picture(a.get('image', ''), a.get('imageAlt', '')),
                    a.get('layout', '')]))
            elif model == 'support-card':
                out.append(block('support-card', [
                    decode_rich(a.get('heading', '')), decode_rich(a.get('body', ''))]))
            else:
                out.append(block(slug(a.get('name', 'block')), [
                    decode_rich(a.get('text', '')),
                    picture(a.get('image', ''), a.get('imageAlt', '')),
                    a.get('layout', '')]))

    if section_style:
        out.append('<div class="section-metadata">\n    <div>\n'
                   + cell('style') + '\n' + cell(section_style)
                   + '\n    </div>\n\n</div>')
    out.append('</div>')

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n\n\n'.join(out) + '\n')
    print(f'Wrote {out_path} ({len(out)} nodes)')


if __name__ == '__main__':
    main()
