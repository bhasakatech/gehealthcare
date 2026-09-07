#!/usr/bin/env python3
"""Build Google-Sheets-ready files from search-assets.json.

Produces (no third-party deps — xlsx is a zip of XML built by hand):
  tools/importer/search-assets.xlsx  — open directly in Google Sheets / Excel
  tools/importer/search-assets.tsv   — tab-separated, paste straight into a sheet

Run after build-search-assets.py:
  python3 tools/importer/build-search-assets-xlsx.py
"""
import json
import zipfile
from xml.sax.saxutils import escape

SRC = 'search-assets.json'
XLSX = 'tools/importer/search-assets.xlsx'
TSV = 'tools/importer/search-assets.tsv'
COLS = ['title', 'url', 'category', 'fileType', 'description', 'presentation', 'guideline']


def col_letter(idx):
    """0-based column index -> spreadsheet letter (A, B, ... Z, AA)."""
    s = ''
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        s = chr(65 + rem) + s
    return s


def cell(ref, text):
    # inlineStr keeps every value as text (URLs, etc.) with no shared-string table.
    return (f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">'
            f'{escape(str(text))}</t></is></c>')


def build_sheet(rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
           '<sheetData>']
    for r, row in enumerate(rows, start=1):
        cells = ''.join(cell(f'{col_letter(c)}{r}', v) for c, v in enumerate(row))
        out.append(f'<row r="{r}">{cells}</row>')
    out.append('</sheetData></worksheet>')
    return ''.join(out)


CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''

ROOT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

WORKBOOK = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="search-assets" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>'''


def main():
    data = json.load(open(SRC, encoding='utf-8'))['data']
    rows = [COLS] + [[item.get(c, '') for c in COLS] for item in data]

    with zipfile.ZipFile(XLSX, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CONTENT_TYPES)
        z.writestr('_rels/.rels', ROOT_RELS)
        z.writestr('xl/workbook.xml', WORKBOOK)
        z.writestr('xl/_rels/workbook.xml.rels', WB_RELS)
        z.writestr('xl/worksheets/sheet1.xml', build_sheet(rows))

    with open(TSV, 'w', encoding='utf-8') as f:
        for row in rows:
            f.write('\t'.join(str(v).replace('\t', ' ').replace('\n', ' ') for v in row) + '\n')

    print(f'Wrote {XLSX} and {TSV} ({len(data)} assets)')


if __name__ == '__main__':
    main()
