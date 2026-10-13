#!/usr/bin/env python3
"""Record the pronunciations with Kokoro, an open speech model (Apache 2.0).

  python3 english/tools/voice.py fetch MODEL_DIR [voice ...]
        -> the Kokoro ONNX model and voices from huggingface.co (onnx-community/Kokoro-82M-v1.0-ONNX)
  python3 english/tools/voice.py samples MODEL_DIR OUT_DIR voice[,voice...]
        -> a few words, sentences and cheers in each voice, to pick a voice by ear
  python3 english/tools/voice.py all MODEL_DIR VOICE
        -> english/voice/w/<word>.mp3  the word
           english/voice/s/<word>.mp3  the word, slowly
           english/voice/e/<word>.mp3  the example sentence
           english/voice/c/<name>.mp3  the cat teacher's cheers

Needs: pip install kokoro-onnx soundfile, and ffmpeg with libmp3lame.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
HF = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
RATE = 24000
WORD_SPEED, SLOW_SPEED, SENTENCE_SPEED = 0.9, 0.62, 0.95
# Short lines the cat teacher says. The key is the file name, used by js/sound.js.
CHEERS = {
    "great": "Great job!",
    "awesome": "Awesome!",
    "perfect": "Perfect!",
    "nice": "Nice!",
    "yes": "Yes! That's right!",
    "wow": "Wow, amazing!",
    "almost": "Oops! Almost!",
    "try": "Nice try!",
    "go": "Let's go!",
    "done": "Time's up!",
}


def words() -> list[dict]:
    out = subprocess.run(
        ["node", "-e", "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.WORDS))",
         str(ROOT / "js" / "words.js")], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def fetch(model_dir: Path, voices: list[str]) -> None:
    model_dir.mkdir(parents=True, exist_ok=True)
    wanted = [("onnx/model.onnx", model_dir / "model.onnx")]
    wanted += [(f"voices/{v}.bin", model_dir / f"{v}.bin") for v in voices]
    for src, dst in wanted:
        if dst.exists() and dst.stat().st_size > 0:
            continue
        print("download", src)
        subprocess.run(["curl", "-fL", "--retry", "3", "-o", str(dst), f"{HF}/{src}"], check=True)


def engine(model_dir: Path, voices: list[str]):
    import espeakng_loader
    from kokoro_onnx import EspeakConfig, Kokoro

    # One voice file per voice on Hugging Face; kokoro-onnx wants them together in one .npz.
    pack = model_dir / ("voices-" + "-".join(sorted(voices)) + ".npz")
    if not pack.exists():
        np.savez(pack, **{v: np.fromfile(model_dir / f"{v}.bin", dtype=np.float32).reshape(-1, 1, 256) for v in voices})
    cfg = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=espeakng_loader.get_data_path())
    return Kokoro(str(model_dir / "model.onnx"), str(pack), espeak_config=cfg)


def say(tts, text: str, voice: str, speed: float) -> np.ndarray:
    # Voice names start with a for American and b for British speakers.
    audio, sr = tts.create(text, voice=voice, speed=speed, lang="en-gb" if voice.startswith("b") else "en-us")
    assert sr == RATE
    audio = np.asarray(audio, dtype=np.float32)
    # Even loudness from clip to clip, with a little air before and after.
    rms = float(np.sqrt(np.mean(audio ** 2))) or 1.0
    audio = audio * (0.1 / rms)
    peak = float(np.max(np.abs(audio))) or 1.0
    if peak > 0.89:
        audio *= 0.89 / peak
    pad = lambda ms: np.zeros(int(RATE * ms / 1000), dtype=np.float32)
    return np.concatenate([pad(30), audio, pad(90)])


def mp3(audio: np.ndarray, out: Path, kbps: int = 40) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(RATE), "-ac", "1", "-i", "pipe:",
                    "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", str(out)], input=audio.tobytes(), check=True)


def samples(model_dir: Path, out_dir: Path, voices: list[str]) -> None:
    tts = engine(model_dir, voices)
    ws = {w["w"]: w for w in words()}
    picks = ["apple", "weather", "reluctant", "inevitable", "unprecedented"]
    lines = [(f"w-{p}", p, WORD_SPEED) for p in picks]
    lines += [("e-reluctant", ws["reluctant"]["e"], SENTENCE_SPEED), ("e-slow", ws["slow"]["e"], SENTENCE_SPEED)]
    lines += [(f"c-{k}", t, 1.0) for k, t in list(CHEERS.items())[:4]]
    for v in voices:
        for name, text, speed in lines:
            mp3(say(tts, text, v, speed), out_dir / v / f"{name}.mp3", 48)
        print("samples", v)


def record_all(model_dir: Path, voice: str) -> None:
    tts = engine(model_dir, [voice])
    out = ROOT / "voice"
    ws = words()
    for i, w in enumerate(ws):
        mp3(say(tts, w["w"], voice, WORD_SPEED), out / "w" / f"{w['w']}.mp3")
        mp3(say(tts, w["w"], voice, SLOW_SPEED), out / "s" / f"{w['w']}.mp3")
        mp3(say(tts, w["e"], voice, SENTENCE_SPEED), out / "e" / f"{w['w']}.mp3")
        if i % 30 == 29:
            print(f"{i + 1} / {len(ws)}")
    for k, t in CHEERS.items():
        mp3(say(tts, t, voice, 1.0), out / "c" / f"{k}.mp3", 48)
    (out / "VOICE.txt").write_text(f"Kokoro-82M v1.0 (Apache 2.0), voice {voice}\n", encoding="utf-8")
    (ROOT / "js" / "voice.js").write_text(
        "/* Which recorded voice is in voice/ (written by tools/voice.py all). */\n"
        f"window.VOCAB_VOICE_INFO = {json.dumps({'model': 'Kokoro-82M v1.0', 'voice': voice})};\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in out.rglob("*.mp3"))
    print(f"done: {len(ws) * 3 + len(CHEERS)} clips, {total // 1024} KB")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["fetch"] and len(a) >= 2:
        fetch(Path(a[1]), a[2:] or ["af_heart"])
    elif a[:1] == ["samples"] and len(a) == 4:
        samples(Path(a[1]), Path(a[2]), a[3].split(","))
    elif a[:1] == ["all"] and len(a) == 3:
        record_all(Path(a[1]), a[2])
    else:
        print(__doc__)
        sys.exit(1)
