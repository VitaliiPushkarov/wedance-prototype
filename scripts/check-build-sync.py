"""Verify a build in isolation, without overwriting manually edited dist pages."""
from html.parser import HTMLParser
from pathlib import Path
import difflib
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]

class Tokens(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.items = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.items.append(('start', tag, sorted(attrs)))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag not in {'img', 'br', 'meta', 'link', 'input', 'hr', 'source'}:
            self.items.append(('end', tag))

    def handle_data(self, data):
        text = ' '.join(data.split())
        if text:
            self.items.append(('text', text))

    def handle_comment(self, comment):
        # Hidden sections matter too; ignore only their formatting.
        self.items.append(('comment', Tokens(comment).items))

with tempfile.TemporaryDirectory(prefix='wedance-build-check-') as temporary:
    checkout = Path(temporary)
    for name in ['build.mjs', 'media-layout.mjs']:
        shutil.copy2(ROOT / name, checkout / name)
    shutil.copytree(ROOT / 'src', checkout / 'src')
    (checkout / 'dist').mkdir()
    subprocess.run(['node', str(checkout / 'build.mjs')], check=True)
    actual = {p.name for p in (ROOT / 'dist').glob('*.html')}
    generated = {p.name for p in (checkout / 'dist').glob('*.html')}
    assert actual == generated, f'Page lists differ: {actual ^ generated}'
    failures = []
    for name in sorted(actual):
        before = Tokens((ROOT / 'dist' / name).read_text()).items
        after = Tokens((checkout / 'dist' / name).read_text()).items
        if before != after:
            failures.append(name)
            print('\n'.join(difflib.unified_diff(
                list(map(repr, before)), list(map(repr, after)),
                fromfile=f'dist/{name}', tofile=f'generated/{name}', n=2,
            )))
    if failures:
        raise SystemExit(f'Build would change content: {", ".join(failures)}')
    print(f'All {len(actual)} pages match the build, including hidden sections. Dist was not modified.')
