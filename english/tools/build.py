#!/usr/bin/env python3
"""Build helpers for 영단어 퀘스트 (run from anywhere).

  python3 english/tools/build.py fonts FONT_DIR   -> fonts/fonts.js: Jua, Gowun Dodum and Fredoka cut
                                                   down to the letters the app uses (run again after
                                                   adding Korean text). FONT_DIR holds Jua-Regular.ttf,
                                                   GowunDodum-Regular.ttf and Fredoka.ttf (variable).
  python3 english/tools/build.py stamp            -> writes the current Korean time into index.html as
                                                   the version shown in the sticker album
  python3 english/tools/build.py page OUT [--debug]
                                                -> one self-contained page for a claude.ai Artifact
                                                   preview (--debug shows where each touch lands)
  python3 english/tools/build.py zip OUT_DIR      -> OUT_DIR/vocab-quest-<version>.zip for itch.io

Needs: pip install fonttools brotli (fonts only).
"""
import base64
import io
import json
import re
import sys
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ["js/words.js", "js/art.js", "js/pics.js", "js/voice.js", "js/sound.js", "js/store.js", "js/app.js"]
ZIP_FILES = ["index.html", "manifest.webmanifest", "css", "js", "fonts", "audio", "icons"]
SAMPLES = ["C4", "C5", "Ds5", "Fs5", "A5", "C6", "Ds6", "Fs6", "A6", "C7"]
FONTS = [
    # (family, source file, css descriptors, letters to keep)
    ("Jua", "Jua-Regular.ttf", {}, "all"),
    ("Gowun Dodum", "GowunDodum-Regular.ttf", {}, "all"),
    ("Fredoka", "Fredoka.ttf", {"weight": "400 700"}, "latin"),
]


def kst_version() -> str:
    return datetime.now(timezone(timedelta(hours=9))).strftime("%m%d-%H%M")


def app_text() -> str:
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    for p in sorted((ROOT / "js").glob("*.js")):
        text += p.read_text(encoding="utf-8")
    return text


def build_fonts(src_dir: Path) -> Path:
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer

    used = set(app_text())
    latin = set(chr(c) for c in range(0x20, 0x7F)) | set("×·’‘“”…–—★♥")
    every = "".join(sorted(used | latin))
    lines = ["/* Jua, Gowun Dodum and Fredoka (SIL Open Font License, fonts/OFL-*.txt), cut down to the",
             "   letters this app shows. Made by tools/build.py fonts. */",
             "(function () {",
             "  function add(name, data, desc) {",
             "    try {",
             "      const bin = atob(data);",
             "      const bytes = new Uint8Array(bin.length);",
             "      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);",
             "      const face = new FontFace(name, bytes, desc);",
             "      document.fonts.add(face);",
             "      face.load().catch(function () {});",
             "    } catch (e) { /* the system font stays */ }",
             "  }"]
    for family, fname, desc, which in FONTS:
        font = TTFont(str(src_dir / fname))
        if "fvar" in font:
            font = instancer.instantiateVariableFont(font, {"wght": 600, "wdth": 100})
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        sub = subset.Subsetter(opts)
        keep = every if which == "all" else "".join(sorted(latin))
        sub.populate(text=keep)
        sub.subset(font)
        buf = io.BytesIO()
        font.flavor = "woff2"
        font.save(buf)
        data = base64.b64encode(buf.getvalue()).decode("ascii")
        print(f"{family}: {len(buf.getvalue()) // 1024} KB")
        lines.append(f"  add({json.dumps(family)}, '{data}', {json.dumps(desc)});")
    lines.append("})();")
    out = ROOT / "fonts" / "fonts.js"
    out.write_text("\n".join(lines) + "\n", encoding="ascii")
    return out


def stamp() -> str:
    p = ROOT / "index.html"
    html = p.read_text(encoding="utf-8")
    v = kst_version()
    html, n = re.subn(r'<meta name="version" content="[^"]*">', f'<meta name="version" content="{v}">', html)
    assert n == 1, "version meta not found in index.html"
    p.write_text(html, encoding="utf-8")
    return v


def voice_bundles() -> dict[str, str]:
    """The recordings packed by kind: voice-w.json, voice-s.json, voice-e.json, voice-c.json,
    each mapping a word (or cheer) to its MP3 in base64. js/sound.js reads them when
    window.VOCAB_VOICE is "bundles"."""
    if not (ROOT / "voice").is_dir():
        return {}
    out = {}
    for d in sorted(p for p in (ROOT / "voice").iterdir() if p.is_dir()):
        out[f"voice-{d.name}.json"] = json.dumps({p.stem: base64.b64encode(p.read_bytes()).decode("ascii")
                                                  for p in sorted(d.glob("*.mp3"))})
    return out


def build_page(out: Path, debug: bool) -> Path:
    """Everything in one page body: styles, scripts, fonts and the piano samples inline."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    v = kst_version()
    html = re.sub(r'<meta name="version" content="[^"]*">', f'<meta name="version" content="{v}">', html)
    # The Artifact page supplies the document shell and the viewport; the files next to
    # index.html (manifest, icons) are not published with it.
    for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</?head>\s*", r"<body>\s*", r"</body>\s*", r"</html>\s*",
                r'<meta name="viewport"[^>]*>\s*', r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\s*',
                r'<meta charset="utf-8">\s*']:
        html = re.sub(pat, "", html, flags=re.I)
    css = (ROOT / "css" / "app.css").read_text(encoding="utf-8")
    css += "\n:root { --safe-t: 0px; --safe-b: 0px; --safe-l: 0px; --safe-r: 0px; }\n"
    html = html.replace('<link rel="stylesheet" href="css/app.css">', f"<style>\n{css}</style>")
    html = html.replace('<script src="fonts/fonts.js"></script>',
                        "<script>\n" + (ROOT / "fonts" / "fonts.js").read_text(encoding="ascii") + "</script>")
    audio = {n: base64.b64encode((ROOT / "audio" / f"{n}.mp3").read_bytes()).decode("ascii") for n in SAMPLES}
    # The recorded pronunciations go next to the page as voice-w.json, voice-s.json, voice-e.json
    # and voice-c.json (publish them with it); js/sound.js fetches each kind the first time it is needed.
    bundles = voice_bundles()
    for name, text in bundles.items():
        (out.parent / name).write_text(text, encoding="ascii")
        print(name)
    kinds = list(bundles)
    pre = (f"<script>window.VOCAB_AUDIO = {json.dumps(audio)};"
           + (' window.VOCAB_VOICE = "bundles";' if kinds else "")
           + (" window.VOCAB_DEBUG = true;" if debug else "") + "</script>\n")
    for i, src in enumerate(SCRIPTS):
        code = (ROOT / src).read_text(encoding="utf-8")
        assert "</script" not in code, src
        html = html.replace(f'<script src="{src}"></script>', (pre if i == 0 else "") + f"<script>\n{code}</script>")
    assert 'src="js/' not in html and 'href="css/' not in html
    out.write_text(html, encoding="utf-8")
    print(f"{out} ({out.stat().st_size // 1024} KB, version {v})")
    return out


def build_zip(out_dir: Path) -> Path:
    v = kst_version()
    out = out_dir / f"vocab-quest-{v}.zip"
    bundles = voice_bundles()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name in ZIP_FILES:
            p = ROOT / name
            for f in ([p] if p.is_file() else sorted(p.rglob("*"))):
                if not f.is_file() or f.name.startswith(".") or "__pycache__" in f.parts:
                    continue
                arc = str(f.relative_to(ROOT))
                data = f.read_bytes()
                if arc == "index.html":
                    data = re.sub(rb'<meta name="version" content="[^"]*">',
                                  f'<meta name="version" content="{v}">'.encode(), data)
                    if bundles:
                        tag = b'<script src="js/sound.js"></script>'
                        assert tag in data
                        data = data.replace(tag, b'<script>window.VOCAB_VOICE = "bundles";</script>\n' + tag)
                z.writestr(arc, data)
        # itch.io takes at most 1,000 files in a browser game, so the 1,090 recordings go in
        # as four bundles instead of one file each.
        for name, text in bundles.items():
            z.writestr(name, text)
        count = len(z.namelist())
    assert count <= 1000, f"{count} files: itch.io allows 1000"
    print(f"{out} ({out.stat().st_size // 1024} KB, {count} files)")
    return out


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "fonts" and len(sys.argv) > 2:
        print(build_fonts(Path(sys.argv[2])))
    elif cmd == "stamp":
        print(stamp())
    elif cmd == "page" and len(sys.argv) > 2:
        build_page(Path(sys.argv[2]), "--debug" in sys.argv)
    elif cmd == "zip" and len(sys.argv) > 2:
        build_zip(Path(sys.argv[2]))
    else:
        print(__doc__)
        sys.exit(1)
