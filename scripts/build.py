#!/usr/bin/env python3
"""Package Crayon Piano.

  python3 scripts/build.py samples        -> audio/piano/samples.js (lets index.html play piano sound when opened from a folder)
  python3 scripts/build.py zip            -> dist/crayon-piano-itch.zip (public, classics only), plus
                                             dist/crayon-piano-family.zip when js/songs-family.js is present
  python3 scripts/build.py page OUT.html  -> page body for a claude.ai Artifact preview

js/songs-family.js holds songs that are still under copyright. It is kept out of git
(.gitignore) because this repository is public: copy it into js/ on your own computer.
"""
import base64
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ["index.html", "manifest.webmanifest"]
DIRS = ["css", "js", "audio", "icons", "songs"]
SAMPLES_JS = ROOT / "audio" / "piano" / "samples.js"


def build_samples() -> Path:
    data = {p.stem: base64.b64encode(p.read_bytes()).decode("ascii")
            for p in sorted((ROOT / "audio" / "piano").glob("*.mp3"))}
    SAMPLES_JS.write_text(
        "/* Piano recordings as text, for opening index.html straight from a folder. Made by scripts/build.py. */\n"
        f"window.PIANO_SAMPLES = {json.dumps(data, indent=0)};\n",
        encoding="ascii")
    return SAMPLES_JS


FAMILY_JS = ROOT / "js" / "songs-family.js"
SONGS_TAG = '<script src="js/songs.js"></script>'
FAMILY_TAG = '<script src="js/songs-family.js"></script>\n'


def index_html(family: bool) -> str:
    """index.html, with songs-family.js loaded before songs.js for the family build."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if family:
        assert SONGS_TAG in html, "songs.js script tag not found in index.html"
        html = html.replace(SONGS_TAG, FAMILY_TAG + SONGS_TAG)
    return html


def build_zip(family: bool) -> Path:
    """Public build: only the out-of-copyright classics. Family build: also songs-family.js."""
    out = ROOT / "dist" / ("crayon-piano-family.zip" if family else "crayon-piano-itch.zip")
    out.parent.mkdir(exist_ok=True)
    skip = {SAMPLES_JS} | (set() if family else {FAMILY_JS})
    paths = [ROOT / f for f in FILES]
    for d in DIRS:
        # samples.js is only for opening from a folder; a website loads the MP3 files.
        paths += sorted(p for p in (ROOT / d).rglob("*") if p.is_file() and p not in skip)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in paths:
            # index.html must sit at the top of the zip for itch.io.
            name = p.relative_to(ROOT).as_posix()
            if name == "index.html":
                z.writestr(name, index_html(family))
            else:
                z.write(p, name)
    return out


def build_page(dest: Path) -> Path:
    html = index_html(FAMILY_JS.exists())
    title = re.search(r"<title>.*?</title>", html, re.S).group(0)
    head = re.search(r"<!-- app:head -->(.*?)<!-- /app:head -->", html, re.S).group(1)
    body = re.search(r"<!-- app:body -->(.*?)<!-- /app:body -->", html, re.S).group(1)
    dest.write_text(f"{title}\n{head.strip()}\n{body.strip()}\n", encoding="utf-8")
    return dest


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "zip"
    if cmd == "samples":
        print(build_samples())
    elif cmd == "zip":
        print(build_zip(family=False))
        if FAMILY_JS.exists():
            print(build_zip(family=True))
    elif cmd == "page" and len(sys.argv) > 2:
        print(build_page(Path(sys.argv[2])))
    else:
        sys.exit(__doc__)
