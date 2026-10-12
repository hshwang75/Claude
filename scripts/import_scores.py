#!/usr/bin/env python3
"""Turn Mutopia Project scores (LilyPond) into song data for the app.

  python3 scripts/import_scores.py MUTOPIA_DIR [song-id ...]

MUTOPIA_DIR is a checkout of https://github.com/MutopiaProject/MutopiaProject.
Needs `pip install lilypond mido`. For every song in PIECES below it:
  1. copies the score, updates its syntax with convert-ly,
  2. unfolds every repeat so the piece plays from beginning to end,
  3. renders MIDI with LilyPond and reads the notes back,
  4. picks the melody (the highest note of the melody staff at each moment),
  5. writes songs/<id>.js, which the app loads when the song is chosen.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import lilypond
import mido

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "songs"
BIN = Path(lilypond.executable()).parent

# id: score path under ftp/, the MIDI track that carries the tune (1 = first staff), license, and
# speed (1 = the tempo written in the score; scores without a tempo mark play at 60).
# Optional: start (seconds; skip a long introduction, keeping the bar before the tune comes in) and
# drop_short (seconds; leave out accompaniment notes shorter than this, for a calmer sound).
PIECES = {
    "elise": dict(path="BeethovenLv/WoO59/fur_Elise_WoO59/fur_Elise_WoO59.ly", melody=1, license="Public Domain"),
    "minuet": dict(path="BachJS/BWVAnh114/anna-magdalena-04/anna-magdalena-04.ly", melody=1, license="Public Domain", speed=0.85),
    "turkish": dict(path="MozartWA/KV331/KV331_3_RondoAllaTurca/KV331_3_RondoAllaTurca-lys/KV331_3_RondoAllaTurca.ly", melody=1, license="Public Domain", speed=2.0),
    "farmer": dict(path="SchumannR/O68/schumann-op68-10-gai-laboureur/schumann-op68-10-gai-laboureur.ly", melody=3, license="CC BY-SA 2.5"),
    "danube": dict(path="StraussJJ/O314/blue_danube/blue_danube.ly", melody=1, license="CC BY-SA 4.0"),
    # 송어: without the quick rippling runs of the piano part, which sounded busy under the tune.
    "trout": dict(path="SchubertF/D550/forelle/forelle-lys/forelle.ly", melody=1, license="Public Domain", start=8.0, drop_short=0.15),
    "mountain": dict(path="GriegE/O46/Dans_l_antre_du_roi_de_la_montagne/Dans_l_antre_du_roi_de_la_montagne.ly", melody=1, license="Public Domain", speed=1.7),
    "puppy": dict(path="ChopinFF/O64/chopin_valse_op64_no1/chopin_valse_op64_no1-lys/chopin_valse_op64_no1.ly", melody=1, license="Public Domain"),
    "entertainer": dict(path="JoplinS/entertainer/entertainer.ly", melody=1, license="Public Domain"),
    "gymnopedie": dict(path="SatieE/gymnopedie_1/gymnopedie_1.ly", melody=1, license="Public Domain", speed=1.15),
    "soldiers": dict(path="TchaikovskyPI/O39/05MarchOfTheWoodenSoldiers/05MarchOfTheWoodenSoldiers.ly", melody=1, license="Public Domain"),
    "military": dict(path="SchubertF/D733/SchubertF-D733-1-TroisMarches/SchubertF-D733-1-TroisMarches.ly", melody=3, license="Public Domain"),
    "traumerei": dict(path="SchumannR/O15/SchumannOp15No07/SchumannOp15No07.ly", melody=1, license="Public Domain"),
    "arabesque": dict(path="BurgmullerJFF/O100/25EF-02/25EF-02.ly", melody=1, license="Public Domain"),
    "sonatina": dict(path="ClementiM/O36/sonatina-1/sonatina-1.ly", melody=1, license="Public Domain", midi_index=0),
    "sonatafacile": dict(path="MozartWA/KV545/K545-1/K545-1.ly", melody=1, license="CC BY-SA 3.0"),
    "schubertlullaby": dict(path="SchubertF/D498/schubert_wiegen_lied/schubert_wiegen_lied.ly", melody=1, license="Public Domain"),
}


# Small source fixes for scores written for old LilyPond versions.
FIXES = {
    "SchubertF/D550/forelle/forelle-lys/forelle.ly": [
        (r"\\lyricsto mel \\new Lyrics \{ \\text \}", r"\\new Lyrics \\lyricsto mel { \\text }"),
        (r"\\context Dynamics\s*=\s*dynamics", r'\\context Dynamics = "dynamics"'),
    ],
    "SchubertF/D498/schubert_wiegen_lied/schubert_wiegen_lied.ly": [
        (r"\\RemoveEmptyStaffContext", r"\\Staff \\RemoveEmptyStaves"),
    ],
    "SchumannR/O15/SchumannOp15No07/SchumannOp15No07.ly": [
        (r"Engraver_group_engraver", "Engraver_group"),
        (r"Performer_group_performer", "Performer_group"),
        (r"\\sustainDown", r"\\sustainOn"),
        (r"\\sustainUp", r"\\sustainOff"),
    ],
}


def unfold_scores(text: str) -> str:
    """Put \\unfoldRepeats at the start of every \\score block that does not already unfold."""
    out, pos = [], 0
    for m in re.finditer(r"\\score\s*\{", text):
        if m.start() < pos:
            continue
        depth, i = 1, m.end()
        while i < len(text) and depth:
            c = text[i]
            if c == "%":  # skip comments
                j = text.find("\n", i)
                i = len(text) if j < 0 else j
                continue
            depth += c == "{"
            depth -= c == "}"
            i += 1
        body = text[m.end():i]
        out.append(text[pos:m.end()])
        out.append(body if "unfoldRepeats" in body else " \\unfoldRepeats " + body)
        pos = i
    out.append(text[pos:])
    return "".join(out)


def render_midi(mutopia: Path, rel: str, work: Path) -> list[Path]:
    src = mutopia / "ftp" / rel
    shutil.copytree(src.parent, work, symlinks=True, dirs_exist_ok=True)
    lys = sorted(work.rglob("*.ly"))
    subprocess.run([str(BIN / "convert-ly"), "-e", "-q", *map(str, lys)], check=False,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    main = work / src.name
    text = main.read_text(encoding="utf-8", errors="replace")
    # Play every repeat in full, the way a pianist would.
    text = text.replace("\\applyMusic #unfold-repeats", "\\unfoldRepeats")
    text = unfold_scores(text)
    for old, new in FIXES.get(rel, []):
        text = re.sub(old, new, text)
    main.write_text(text, encoding="utf-8")
    proc = subprocess.run([str(BIN / "lilypond"), "-dno-print-pages", "-dmidi-extension=mid", "--loglevel=ERROR",
                           "-o", str(work / "out"), str(main)], cwd=main.parent, capture_output=True, text=True)
    mids = sorted(work.glob("out*.mid"), key=lambda p: (len(p.stem), p.stem))  # out, out-1, out-2 ...
    if not mids:
        raise RuntimeError(f"no MIDI for {rel}:\n{proc.stderr[-2000:]}")
    return mids


def read_notes(mid_path: Path):
    """All notes as (start_s, dur_s, pitch, velocity, track), using the file's tempo changes."""
    mf = mido.MidiFile(mid_path)
    tempo_map = []  # (tick, tempo)
    for tr in mf.tracks:
        t = 0
        for msg in tr:
            t += msg.time
            if msg.type == "set_tempo":
                tempo_map.append((t, msg.tempo))
    tempo_map.sort()
    if not tempo_map or tempo_map[0][0] > 0:
        tempo_map.insert(0, (0, 500000))

    def seconds(tick):
        s, last_tick, last_tempo = 0.0, 0, tempo_map[0][1]
        for tk, tp in tempo_map:
            if tk >= tick:
                break
            s += (tk - last_tick) * last_tempo / mf.ticks_per_beat / 1e6
            last_tick, last_tempo = tk, tp
        return s + (tick - last_tick) * last_tempo / mf.ticks_per_beat / 1e6

    notes, names = [], []
    for ti, tr in enumerate(mf.tracks):
        names.append(tr.name)
        t, on = 0, {}
        for msg in tr:
            t += msg.time
            if msg.type == "note_on" and msg.velocity > 0:
                on.setdefault((msg.channel, msg.note), []).append((t, msg.velocity))
            elif msg.type in ("note_off", "note_on"):
                stack = on.get((msg.channel, msg.note))
                if stack:
                    st, vel = stack.pop(0)
                    s0 = seconds(st)
                    notes.append((s0, max(0.03, seconds(t) - s0), msg.note, vel, ti))
    notes.sort()
    read_notes.tempos = sorted({round(60e6 / tp) for _, tp in tempo_map})
    return notes, names


def melody_of(notes, track):
    """Highest note of the melody track at each onset (notes starting within 30 ms count as one chord)."""
    mel, group = [], []
    for n in (n for n in notes if n[4] == track):
        if group and n[0] - group[0][0] > 0.03:
            mel.append(max(group, key=lambda x: x[2]))
            group = []
        group.append(n)
    if group:
        mel.append(max(group, key=lambda x: x[2]))
    return mel


def export(song_id: str, cfg: dict, mutopia: Path) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        mids = render_midi(mutopia, cfg["path"], Path(tmp))
        notes, names = read_notes(mids[cfg.get("midi_index", 0)])
    melody = set(map(id, melody_of(notes, cfg["melody"])))
    mel = [n for n in notes if id(n) in melody]
    rest = [n for n in notes if id(n) not in melody]
    if cfg.get("drop_short"):
        rest = [n for n in rest if n[1] >= cfg["drop_short"]]
    if cfg.get("start"):
        cut = cfg["start"]
        mel = [[n[0] - cut, *n[1:]] for n in mel if n[0] >= cut]
        rest = [[n[0] - cut, *n[1:]] for n in rest if n[0] >= cut]
        notes = mel + rest
    speed = cfg.get("speed", 1)
    ms = lambda v: int(round(v * 1000 / speed))
    data = {
        # [start ms, length ms, MIDI note, velocity 1-127]
        "melody": [[ms(n[0]), ms(n[1]), n[2], n[3]] for n in mel],
        "accompaniment": [[ms(n[0]), ms(n[1]), n[2], n[3]] for n in rest],
    }
    OUT.mkdir(exist_ok=True)
    (OUT / f"{song_id}.js").write_text(
        f"/* {song_id}: notes made from the Mutopia Project score ftp/{cfg['path']} ({cfg['license']})\n"
        f"   by scripts/import_scores.py. https://www.mutopiaproject.org */\n"
        f"(window.SONG_DATA = window.SONG_DATA || {{}})[{json.dumps(song_id)}] = {json.dumps(data, separators=(',', ':'))};\n",
        encoding="utf-8")
    end = max(n[0] + n[1] for n in notes) / speed
    per_track = [sum(1 for n in notes if n[4] == t) for t in range(len(names))]
    return dict(id=song_id, tracks=list(zip(names, per_track)), notes=len(notes), melody=len(mel), seconds=round(end, 1),
                bpm=read_notes.tempos,
                melody_range=(min(n[2] for n in mel), max(n[2] for n in mel)),
                melody_start=[n[2] for n in mel[:16]])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    mutopia = Path(sys.argv[1])
    for sid in sys.argv[2:] or PIECES:
        try:
            print(json.dumps(export(sid, PIECES[sid], mutopia), ensure_ascii=False))
        except Exception as e:  # keep going with the other pieces
            print(json.dumps({"id": sid, "error": str(e)[-600:]}, ensure_ascii=False))
