# The audio studio — a local web UI for auditioning SILMA TTS and curating the
# pronunciation clips in public/audio/. Runs INSIDE the Docker image (like
# generate.py); launch it with scripts/audio-studio.sh and open
# http://localhost:7861/.
#
# What it offers over the batch generate.py:
#   - type any Arabic text and hear the model speak it (with speed control)
#   - see every [data-speak] phrase from src/content with its clip status
#   - re-roll a phrase until a take sounds right, THEN accept it — only
#     accepting writes public/audio/<hash>.wav and the manifest entry
#
# Don't run it at the same time as generate.py — both write manifest.json and
# the last writer wins.
#
# The numbers normalizer (NeMo) is disabled here: it adds ~10 minutes of FST
# grammar building to every boot and the studio is for short vocalized Arabic
# phrases, not digits. The batch generate.py keeps it on for robustness.
import hashlib
import json
import re
import tempfile
import threading
import unicodedata
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np
import soundfile as sf

REPO = Path("/repo")
CONTENT = REPO / "src" / "content"
OUT = REPO / "public" / "audio"
MANIFEST = OUT / "manifest.json"
REF_AUDIO = str(REPO / "scripts" / "tts" / "ar.ref.24k.wav")
REF_TEXT = "ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام."

# Same thresholds as generate.py — shown in the UI so a bad take is obvious.
MIN_PEAK = 0.02
MIN_SECONDS = 0.12

infer_lock = threading.Lock()  # one synthesis at a time; the model isn't reentrant
previews = {}  # token -> {"text": ..., "path": ...}; accepted or replaced, never GC'd (dev tool)


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


def read_manifest():
    return json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}


def measure(path):
    data, sr = sf.read(path)
    return round(float(np.abs(data).max()), 4), round(len(data) / sr, 3)


print("Loading SILMA TTS model (a minute or two on CPU)...", flush=True)
from silma_tts.api import SilmaTTS  # noqa: E402

tts = SilmaTTS(enable_normalizer=False)
print("Model ready — open http://localhost:7861/", flush=True)


PAGE = """<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>استوديو الأصوات — SILMA TTS</title>
<style>
  body { font-family: 'Noto Naskh Arabic', 'Geeza Pro', serif; margin: 2rem auto; max-width: 60rem; padding: 0 1rem; background: #14151a; color: #e8e6e3; }
  h1 { font-size: 1.4rem; } h2 { font-size: 1.1rem; margin-top: 2rem; }
  .try { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
  input[type=text] { flex: 1; min-width: 16rem; font: inherit; font-size: 1.3rem; padding: .5rem .8rem; background: #1e2027; color: inherit; border: 1px solid #3a3d47; border-radius: .5rem; }
  button { font: inherit; padding: .45rem 1rem; border-radius: .5rem; border: 1px solid #3a3d47; background: #262a33; color: inherit; cursor: pointer; }
  button:hover { background: #313644; }
  button.accept { background: #1e4d2b; } button.accept:hover { background: #266338; }
  button:disabled { opacity: .45; cursor: wait; }
  #status { color: #9aa0ac; min-height: 1.4em; margin: .6rem 0; }
  #take { margin: .4rem 0; color: #9aa0ac; }
  .bad { color: #e08484; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: .35rem .6rem; border-bottom: 1px solid #2a2d36; text-align: right; }
  td.phrase { font-size: 1.25rem; }
  .dot { display: inline-block; width: .6em; height: .6em; border-radius: 50%; margin-inline-start: .4em; }
  .ok { background: #58c273; } .missing { background: #e0a84c; }
  small { color: #7d8390; }
</style>
</head>
<body>
<h1>استوديو الأصوات <small>SILMA TTS v1 · محلي فقط</small></h1>

<div class="try">
  <input id="text" type="text" placeholder="اكتب نصًّا مشكولًا لتجربته…" />
  <label>السرعة <input id="speed" type="number" min="0.5" max="1.5" step="0.05" value="1.0" style="width:4.5rem"></label>
  <button id="gen">🎙 توليد</button>
</div>
<div id="status"></div>
<div id="take" hidden>
  <audio id="player" controls></audio>
  <span id="meta"></span>
  <button id="regen">🎲 محاولة أخرى</button>
  <button id="accept" class="accept">✓ اعتماد هذا الصوت</button>
</div>

<h2>عبارات الدروس <small id="counts"></small></h2>
<table id="list"><tr><th>العبارة</th><th>الحالة</th><th>القياسات</th><th></th></tr></table>

<script>
const $ = (id) => document.getElementById(id);
let current = null; // {token, text}

async function refresh() {
  const r = await fetch('/api/phrases'); const rows = await r.json();
  const done = rows.filter(p => p.file).length;
  $('counts').textContent = done + ' / ' + rows.length + ' مسجّلة';
  const table = $('list');
  table.querySelectorAll('tr + tr').forEach(tr => tr.remove());
  for (const p of rows) {
    const tr = document.createElement('tr');
    const flag = p.file && (p.peak < %MIN_PEAK% || p.dur < %MIN_SECONDS%);
    tr.innerHTML =
      '<td class="phrase">' + p.text + '<span class="dot ' + (p.file ? 'ok' : 'missing') + '"></span></td>' +
      '<td>' + (p.file ? '<audio controls preload="none" src="/clip/' + p.file + '"></audio>' : 'غير مسجّلة') + '</td>' +
      '<td' + (flag ? ' class="bad"' : '') + '>' + (p.file ? p.dur + 's · peak ' + p.peak : '') + '</td>' +
      '<td><button data-text="' + p.text + '">🎙 إعادة توليد</button></td>';
    tr.querySelector('button').onclick = (e) => { $('text').value = e.target.dataset.text; generate(); };
    table.appendChild(tr);
  }
}

async function generate() {
  const text = $('text').value.trim();
  if (!text) return;
  $('gen').disabled = $('regen').disabled = true;
  $('status').textContent = 'يولّد… (نحو نصف دقيقة على المعالج)';
  $('take').hidden = true;
  try {
    const r = await fetch('/api/tts', { method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({ text, speed: parseFloat($('speed').value) || 1.0 }) });
    if (!r.ok) throw new Error(await r.text());
    const take = await r.json();
    current = { token: take.token, text };
    $('player').src = '/preview/' + take.token;
    const bad = take.peak < %MIN_PEAK% || take.dur < %MIN_SECONDS%;
    $('meta').innerHTML = take.dur + 's · peak ' + take.peak + (bad ? ' <span class="bad">— ضعيف/صامت، أعد المحاولة</span>' : '');
    $('take').hidden = false;
    $('status').textContent = '';
    $('player').play();
  } catch (e) {
    $('status').textContent = 'فشل التوليد: ' + e.message;
  } finally {
    $('gen').disabled = $('regen').disabled = false;
  }
}

async function accept() {
  if (!current) return;
  const r = await fetch('/api/accept', { method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({ token: current.token }) });
  if (!r.ok) { $('status').textContent = 'فشل الاعتماد: ' + await r.text(); return; }
  const res = await r.json();
  $('status').textContent = 'اعتُمد: ' + current.text + ' ← ' + res.file;
  $('take').hidden = true; current = null;
  refresh();
}

$('gen').onclick = generate;
$('regen').onclick = generate;
$('accept').onclick = accept;
$('text').addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });
refresh();
</script>
</body>
</html>"""
PAGE = PAGE.replace("%MIN_PEAK%", str(MIN_PEAK)).replace("%MIN_SECONDS%", str(MIN_SECONDS))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # quieter default logging
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/":
            return self._send(200, PAGE.encode("utf-8"), "text/html; charset=utf-8")
        if self.path == "/api/phrases":
            manifest = read_manifest()
            rows = []
            for p in collect_phrases():
                f = manifest.get(p)
                if f and (OUT / f).exists():
                    peak, dur = measure(OUT / f)
                    rows.append({"text": p, "file": f, "peak": peak, "dur": dur})
                else:
                    rows.append({"text": p, "file": None})
            return self._send(200, rows)
        if self.path.startswith("/clip/"):
            name = Path(self.path[len("/clip/"):]).name  # basename only — no traversal
            f = OUT / name
            if f.suffix == ".wav" and f.exists():
                return self._send(200, f.read_bytes(), "audio/wav")
            return self._send(404, {"error": "no such clip"})
        if self.path.startswith("/preview/"):
            take = previews.get(self.path[len("/preview/"):])
            if take and Path(take["path"]).exists():
                return self._send(200, Path(take["path"]).read_bytes(), "audio/wav")
            return self._send(404, {"error": "no such take"})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("content-length", 0)) or 0) or b"{}")
        if self.path == "/api/tts":
            text = key(body.get("text", ""))
            if not text:
                return self._send(400, {"error": "empty text"})
            path = Path(tempfile.mkstemp(suffix=".wav")[1])
            try:
                with infer_lock:
                    tts.infer(
                        ref_file=REF_AUDIO,
                        ref_text=REF_TEXT,
                        gen_text=text,
                        file_wave=str(path),
                        force_tashkeel=False,   # keep the authored tashkeel verbatim
                        normalize_numbers=False,  # normalizer not loaded (see header)
                        speed=float(body.get("speed", 1.0)),
                    )
            except Exception as e:
                return self._send(500, {"error": str(e)[:300]})
            peak, dur = measure(path)
            token = uuid.uuid4().hex
            previews[token] = {"text": text, "path": str(path)}
            return self._send(200, {"token": token, "peak": peak, "dur": dur})
        if self.path == "/api/accept":
            take = previews.get(body.get("token", ""))
            if not take:
                return self._send(404, {"error": "unknown take token"})
            dest = OUT / fname(take["text"])
            OUT.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(Path(take["path"]).read_bytes())
            manifest = read_manifest()
            manifest[key(take["text"])] = dest.name
            MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
            return self._send(200, {"file": dest.name})
        return self._send(404, {"error": "not found"})


ThreadingHTTPServer(("0.0.0.0", 7861), Handler).serve_forever()
