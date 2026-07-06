# Generate the pronunciation clips behind the [data-speak] buttons (see
# src/scripts/speak.js). Runs INSIDE the Docker image built from the Dockerfile
# next to this file — don't run it on the host; macOS can't install modern
# torch. Drive it via scripts/generate-audio.sh.
#
# What it does:
#   1. Scans src/content/**/*.mdx for data-speak="..." phrases.
#   2. Synthesizes each phrase with SILMA TTS v1 (Apache-2.0, silma-ai/silma-tts)
#      voice-cloned from scripts/tts/ar.ref.24k.wav (the model's own sample).
#   3. Writes public/audio/<sha1(phrase)[:12]>.wav + manifest.json mapping the
#      NFC-normalized phrase → filename. speak.js does the same normalization
#      at lookup time, so the two must stay in sync.
#
# Resumable by design: clips that already exist are skipped and the manifest is
# rewritten after every clip, so an interrupted run loses at most one clip.
# Re-record a phrase by deleting its .wav and rerunning.
import hashlib
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

REPO = Path("/repo")  # mounted by generate-audio.sh
CONTENT = REPO / "src" / "content"
OUT = REPO / "public" / "audio"

REF_AUDIO = str(REPO / "scripts" / "tts" / "ar.ref.24k.wav")
# The transcript of ar.ref.24k.wav — the model clones the reference voice and
# needs to know what it says.
REF_TEXT = "ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام."

# The diffusion model occasionally emits pure silence — or a sub-0.1s blip at
# -40dB — for single-syllable inputs (seen even from the official HF space
# demo). Every clip is checked and substandard output re-rolled with a fresh
# seed. Thresholds tuned against real duds: silent clips measured at -90dB,
# blips at ~0.06s / -45dB, while good single-syllable clips run ≥0.12s with
# peaks near full scale.
ATTEMPTS = 6
MIN_PEAK = 0.02  # ≈ -34 dBFS
MIN_SECONDS = 0.12


def key(text):
    return unicodedata.normalize("NFC", text.strip())


def fname(text):
    return hashlib.sha1(key(text).encode("utf-8")).hexdigest()[:12] + ".wav"


def collect_phrases():
    phrases = set()
    for mdx in CONTENT.rglob("*.mdx"):
        for m in re.finditer(r'data-speak="([^"]+)"', mdx.read_text(encoding="utf-8")):
            phrases.add(key(m.group(1)))
    return sorted(phrases)


phrases = collect_phrases()
OUT.mkdir(parents=True, exist_ok=True)
manifest_path = OUT / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}

# Drop manifest entries whose phrase left the content or whose file was deleted
# (deleting a .wav is how you ask for a re-record).
manifest = {k: v for k, v in manifest.items() if k in phrases and (OUT / v).exists()}

todo = [p for p in phrases if not (OUT / fname(p)).exists()]
for p in phrases:
    if (OUT / fname(p)).exists():
        manifest[p] = fname(p)
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"{len(phrases)} phrases in content, {len(todo)} to generate", flush=True)
if not todo:
    sys.exit(0)

import numpy as np  # noqa: E402 — heavy imports only when there is work
import soundfile as sf  # noqa: E402
from silma_tts.api import SilmaTTS  # noqa: E402


def is_unusable(path):
    data, sr = sf.read(path)
    return float(np.abs(data).max()) < MIN_PEAK or len(data) / sr < MIN_SECONDS


tts = SilmaTTS()
failures = []

for i, p in enumerate(todo):
    t0 = time.time()
    dest = OUT / fname(p)
    try:
        for attempt in range(ATTEMPTS):
            tts.infer(
                ref_file=REF_AUDIO,
                ref_text=REF_TEXT,
                gen_text=p,
                file_wave=str(dest),
                # phrases are authored with full tashkeel — keep it verbatim;
                # the auto-diacritizer strips vowels off single letters
                # (it turned 'أَ' into bare 'أ', which synthesizes to silence)
                force_tashkeel=False,
                # a slower render on later retries tends to shake silence loose
                speed=1.0 if attempt < 3 else 0.85,
            )
            if not is_unusable(dest):
                break
            print(f"    unusable (silent/blip) output for {p!r}, retry {attempt + 1}", flush=True)
        else:
            dest.unlink(missing_ok=True)
            raise RuntimeError(f"unusable after {ATTEMPTS} attempts")
        manifest[p] = fname(p)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[{i + 1}/{len(todo)}] ok  {p!r} -> {dest.name} ({dest.stat().st_size} B, {time.time() - t0:.1f}s)", flush=True)
    except Exception as e:
        failures.append(p)
        print(f"[{i + 1}/{len(todo)}] FAIL {p!r}: {str(e)[:200]}", flush=True)

print(f"done: {len(manifest)} clips in manifest, {len(failures)} failures", flush=True)
sys.exit(1 if failures else 0)
