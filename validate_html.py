import os
import re
from pathlib import Path

BASE = Path(__file__).parent
html_files = sorted([p for p in BASE.glob('*.html')])

def extract_attrs(text, attr):
    pattern = rf'{attr}\s*=\s*"([^"]+)"|{attr}\s*=\s*\'([^\']+)\''
    # simpler: find both double and single quoted
    matches = re.findall(rf'{attr}\s*=\s*"([^"]+)"|{attr}\s*=\s*\'([^\']+)\'', text)
    vals = []
    for a,b in matches:
        vals.append(a or b)
    return vals

issues = []
summary = {'files': len(html_files), 'missing_files': 0, 'missing_assets': 0, 'warnings': 0}

for f in html_files:
    text = f.read_text(encoding='utf-8', errors='ignore')
    rel = f.name
    print(f"\nChecking {rel}")

    # find local html links
    hrefs = extract_attrs(text, 'href')
    for href in hrefs:
        h = href.split('#')[0].split('?')[0]
        if not h:
            continue
        if any(h.startswith(s) for s in ('http:', 'https:', 'mailto:', 'tel:', 'javascript:', 'data:')):
            continue
        # if it's an anchor to same page (starts with #) we skip earlier
        if h.endswith('.html') or '/' in h or h.endswith('.htm'):
            # resolve relative path
            target = (f.parent / h).resolve()
            if not target.exists():
                summary['missing_files'] += 1
                issues.append((rel, 'MISSING_LINK', href))
                print(f"  ERROR: linked file not found -> {href}")

    # find src assets
    srcs = extract_attrs(text, 'src')
    for src in srcs:
        s = src.split('#')[0].split('?')[0]
        if not s:
            continue
        if any(s.startswith(s2) for s2 in ('http:', 'https:', 'data:')):
            continue
        target = (f.parent / s).resolve()
        if not target.exists():
            summary['missing_assets'] += 1
            issues.append((rel, 'MISSING_ASSET', src))
            print(f"  WARNING: referenced asset not found -> {src}")

    # basic checks for expected nav ids for mobile toggle
    if 'id="navMenu"' not in text and 'id=\'navMenu\'' not in text:
        summary['warnings'] += 1
        issues.append((rel, 'NO_NAVMENU', None))
        print(f"  WARNING: page missing element with id 'navMenu' (mobile nav may not work)")
    if 'id="menuToggle"' not in text and 'id=\'menuToggle\'' not in text:
        summary['warnings'] += 1
        issues.append((rel, 'NO_MENUTOGGLE', None))
        print(f"  WARNING: page missing element with id 'menuToggle' (mobile toggle may not work)")

print('\nValidation complete.')
print(f"Files checked: {summary['files']}")
print(f"Missing linked files: {summary['missing_files']}")
print(f"Missing local assets: {summary['missing_assets']}")
print(f"Other warnings: {summary['warnings']}")

if issues:
    print('\nDetailed issues:')
    for it in issues:
        print(' -', it)
else:
    print('\nNo issues detected.')
