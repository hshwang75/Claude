#!/usr/bin/env python3
"""Record the pronunciations with Kokoro, an open speech model (Apache 2.0).

  python3 english/tools/voice.py fetch MODEL_DIR [voice ...]
        -> the Kokoro ONNX model and voices from huggingface.co (onnx-community/Kokoro-82M-v1.0-ONNX)
  python3 english/tools/voice.py samples MODEL_DIR OUT_DIR voice[,voice...]
        -> a few words, sentences and cheers in each voice, to pick a voice by ear
  python3 english/tools/voice.py redo MODEL_DIR VOICE word [word ...]
        -> records just those words again (after fixing WORD_PHONEMES, say)
  python3 english/tools/voice.py all MODEL_DIR VOICE [OUT_DIR]
        -> english/voice/w/<word>.mp3  the word
           english/voice/s/<word>.mp3  the word, slowly
           english/voice/e/<word>.mp3  the example sentence
           english/voice/c/<name>.mp3  the cat teacher's cheers

Needs: pip install kokoro-onnx soundfile, and ffmpeg with libmp3lame. With faster-whisper installed
every clip is also checked by ear (Whisper small.en) and re-made when it is heard as another word.
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
HF = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
# The same model exported to also report how long each sound lasts; used to cut clips exactly.
HF_TIMED = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped/resolve/main"
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


# Words spelled alike but said differently by meaning. Read alone, the speech model picks one
# meaning; these give the pronunciation that matches the meaning taught in the app.
WORD_PHONEMES = {
    "close": "klˈoʊz",           # 닫다 (not 가까운)
    "increase": "ɪŋkɹˈiːs",      # 증가하다, stress on the second part
    "graduate": "ɡɹˈædʒuːˌeɪt",  # 졸업하다 (not 졸업생)
    "elaborate": "ᵻlˈæbɚɹət",    # 정교한 (not 자세히 말하다)
    # Stress the way the dictionary has it (checked against the CMU Pronouncing Dictionary).
    "resource": "ɹˈiːsɔːɹs",
    "insightful": "ˈɪnsaɪtfəl",
    "superficial": "sˌuːpɚfˈɪʃəl",
}


def words() -> list[dict]:
    out = subprocess.run(
        ["node", "-e", "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.WORDS))",
         str(ROOT / "js" / "words.js")], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def fetch(model_dir: Path, voices: list[str]) -> None:
    model_dir.mkdir(parents=True, exist_ok=True)
    wanted = [(f"{HF_TIMED}/onnx/model.onnx", model_dir / "model-ts.onnx")]
    wanted += [(f"{HF}/voices/{v}.bin", model_dir / f"{v}.bin") for v in voices]
    for src, dst in wanted:
        if dst.exists() and dst.stat().st_size > 0:
            continue
        print("download", src)
        subprocess.run(["curl", "-fL", "--retry", "3", "-o", str(dst), src], check=True)


def engine(model_dir: Path, voices: list[str]):
    import espeakng_loader
    from kokoro_onnx import EspeakConfig, Kokoro

    # One voice file per voice on Hugging Face; kokoro-onnx wants them together in one .npz.
    pack = model_dir / ("voices-" + "-".join(sorted(voices)) + ".npz")
    if not pack.exists():
        np.savez(pack, **{v: np.fromfile(model_dir / f"{v}.bin", dtype=np.float32).reshape(-1, 1, 256) for v in voices})
    cfg = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=espeakng_loader.get_data_path())
    return Kokoro(str(model_dir / "model-ts.onnx"), str(pack), espeak_config=cfg)


# Kokoro tends to put a short "uh" in front of whatever starts a recording ("clock" came out as
# "a clock", "sing" as "a thing"): it sits in the time the model gives the start marker. So every
# clip is spoken after a lead-in word and a pause ("Now. clock."), and the model's own timing for
# each sound says exactly where the word begins; everything before that is cut away.
LEAD = "nˈaʊ. "
FRAME = RATE // 100  # 10 ms


def frame_db(audio: np.ndarray) -> np.ndarray:
    n = len(audio) // FRAME
    a = audio[: n * FRAME].reshape(n, FRAME)
    return 20 * np.log10(np.sqrt(np.mean(a ** 2, axis=1)) + 1e-9)


def trim_tail(audio: np.ndarray) -> np.ndarray:
    db = frame_db(audio)
    on = np.nonzero(db > -55)[0]
    return audio[: (on[-1] + 2) * FRAME] if len(on) else audio


def timed(tts, tokens: list[int], voice: str, speed: float) -> tuple[np.ndarray, np.ndarray]:
    """Audio plus, for the start marker, each token and the end marker, its length in frames."""
    style = tts._style_for(tts.get_voice_style(voice), len(tokens))
    audio, durations = tts.sess.run(None, {
        "input_ids": np.array([[0, *tokens, 0]], dtype=np.int64),
        "style": np.asarray(style, dtype=np.float32),
        "speed": np.array([speed], dtype=np.float32),
    })
    return np.asarray(audio, dtype=np.float32).ravel(), np.asarray(durations, dtype=float).ravel()


def say(tts, text: str, voice: str, speed: float, phonemes: str | None = None) -> np.ndarray:
    # Voice names start with a for American and b for British speakers.
    lang = "en-gb" if voice.startswith("b") else "en-us"
    ph = (phonemes or tts.tokenizer.phonemize(text, lang)).strip()
    if ph[-1] not in ".!?":
        ph += "."
    lead, body = tts.tokenizer.tokenize(LEAD), tts.tokenizer.tokenize(ph)
    audio, dur = timed(tts, lead + body, voice, speed)
    assert len(dur) == len(lead) + len(body) + 2, "this model does not report timings"
    per_frame = len(audio) / dur.sum()
    start = int(dur[: 1 + len(lead)].sum() * per_frame) - FRAME * 2  # 20 ms into the pause
    audio = trim_tail(audio[start:])
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


class Ear:
    """Listens to each new clip with Whisper (an open speech recognizer) and says whether it
    hears the intended words. Optional: without faster-whisper installed every clip passes."""

    def __init__(self, tts):
        self.tts = tts
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            print("faster-whisper not installed: clips are not checked by ear")
            self.model = None
            return
        self.model = WhisperModel("small.en", device="cpu", compute_type="int8")

    def hear(self, audio: np.ndarray) -> str:
        # Whisper listens at 16 kHz; ffmpeg's resampler keeps the s and f sounds intact.
        x16 = np.frombuffer(subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(RATE), "-ac", "1", "-i", "pipe:",
             "-f", "f32le", "-ar", "16000", "pipe:"], input=audio.astype(np.float32).tobytes(),
            capture_output=True, check=True).stdout, dtype=np.float32)
        segs, _ = self.model.transcribe(x16, language="en", beam_size=5, without_timestamps=True)
        return " ".join(seg.text.strip() for seg in segs)

    def sounds(self, words: list[str]) -> str:
        ph = self.tts.tokenizer.phonemize(" ".join(words), "en-us")
        return "".join(c for c in ph if c not in "ˈˌ ː")

    def agrees(self, audio: np.ndarray, target: str) -> tuple[bool, str]:
        if self.model is None:
            return True, ""
        heard = self.hear(audio)
        norm = lambda t: re.sub(r"[^a-z' ]", " ", t.lower().replace("-", " ")).split()
        a, b = norm(heard), norm(target)
        if a == b or (a and self.sounds(a) == self.sounds(b)):  # same words, or words that sound alike
            return True, heard
        if len(b) > 2:  # a sentence: allow one small slip of the recognizer
            return difflib.SequenceMatcher(None, a, b).ratio() >= 0.9, heard
        return False, heard


def first_longer(ph: str) -> str:
    """Hold the first sound a little longer (s -> ss), which keeps a soft first sound from fading."""
    return ph[0] + ph if ph[0] not in "ˈˌ" else ph


def best_take(tts, ear: Ear, text: str, voice: str, speed: float, ph: str | None, log: list) -> np.ndarray:
    base = (ph or tts.tokenizer.phonemize(text, "en-us")).strip()
    # Retries stay near the asked speed, so a slow word stays slow.
    longer = first_longer(base)
    tries = [(speed, base), (speed + 0.1, base), (speed, longer), (speed + 0.1, longer), (speed + 0.13, base)]
    first = None
    for sp, p in tries:
        audio = say(tts, text, voice, sp, p)
        ok, heard = ear.agrees(audio, text)
        first = first if first is not None else (audio, heard)
        if ok:
            if (sp, p) != tries[0]:
                log.append(f"fixed  {text!r} at speed {sp:.2f} {p}")
            return audio, True
    log.append(f"CHECK  {text!r} at speed {speed}: heard {first[1]!r} in every take")
    return first[0], False


def record_word(tts, ear: Ear, w: dict, voice: str, out: Path, log: list) -> None:
    ph = WORD_PHONEMES.get(w["w"])
    word, _ = best_take(tts, ear, w["w"], voice, WORD_SPEED, ph, log)
    slow, ok = best_take(tts, ear, w["w"], voice, SLOW_SPEED, ph, log)
    if not ok:  # a clear word beats a slow one that sounds like another word
        log.append(f"       slow {w['w']!r} plays the normal-speed recording")
        slow = word
    mp3(word, out / "w" / f"{w['w']}.mp3", 64)
    mp3(slow, out / "s" / f"{w['w']}.mp3", 64)
    # Where the sentence reads the word the same wrong way as it does alone, swap in the fix.
    sent = None
    if ph:
        wrong = tts.tokenizer.phonemize(w["w"], "en-us").strip()
        full = tts.tokenizer.phonemize(w["e"], "en-us")
        if wrong != ph and wrong in full:
            sent = full.replace(wrong, ph)
    first = None
    for sp in (SENTENCE_SPEED, SENTENCE_SPEED - 0.05, SENTENCE_SPEED + 0.05):
        audio = say(tts, w["e"], voice, sp, sent)
        ok, heard = ear.agrees(audio, w["e"])
        first = first or (audio, heard)
        if ok:
            break
    else:
        log.append(f"CHECK  sentence of {w['w']!r}: heard {first[1]!r}")
        audio = first[0]
    mp3(audio, out / "e" / f"{w['w']}.mp3", 48)


def record_some(model_dir: Path, voice: str, names: list[str]) -> None:
    tts = engine(model_dir, [voice])
    ear, log = Ear(tts), []
    by = {w["w"]: w for w in words()}
    for n in names:
        record_word(tts, ear, by[n], voice, ROOT / "voice", log)
        print("re-recorded", n)
    print("\n".join(log))


def record_all(model_dir: Path, voice: str, out: Path | None = None) -> None:
    tts = engine(model_dir, [voice])
    ear, log = Ear(tts), []
    out = out or ROOT / "voice"
    ws = words()
    for i, w in enumerate(ws):
        record_word(tts, ear, w, voice, out, log)
        if i % 30 == 29:
            print(f"{i + 1} / {len(ws)}", flush=True)
    for k, t in CHEERS.items():
        mp3(best_take(tts, ear, t, voice, 1.0, None, log)[0], out / "c" / f"{k}.mp3", 64)
    (out / "VOICE.txt").write_text(f"Kokoro-82M v1.0 (Apache 2.0), voice {voice}\n", encoding="utf-8")
    (ROOT / "js" / "voice.js").write_text(
        "/* Which recorded voice is in voice/ (written by tools/voice.py all). */\n"
        f"window.VOCAB_VOICE_INFO = {json.dumps({'model': 'Kokoro-82M v1.0', 'voice': voice})};\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in out.rglob("*.mp3"))
    print("\n".join(log))
    print(f"done: {len(ws) * 3 + len(CHEERS)} clips, {total // 1024} KB", flush=True)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["fetch"] and len(a) >= 2:
        fetch(Path(a[1]), a[2:] or ["af_heart"])
    elif a[:1] == ["samples"] and len(a) == 4:
        samples(Path(a[1]), Path(a[2]), a[3].split(","))
    elif a[:1] == ["all"] and len(a) in (3, 4):
        record_all(Path(a[1]), a[2], Path(a[3]) if len(a) == 4 else None)
    elif a[:1] == ["redo"] and len(a) >= 4:
        record_some(Path(a[1]), a[2], a[3:])
    else:
        print(__doc__)
        sys.exit(1)
