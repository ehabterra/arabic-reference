// Pronounce Arabic text aloud. Any element with [data-speak="..."] becomes a
// clickable pronounce trigger. Two tiers:
//   1. Pre-recorded clips (SILMA TTS) shipped under /audio/, looked up in
//      /audio/manifest.json — keyed by the exact phrase, NFC-normalized.
//   2. The browser's built-in speech synthesis as fallback for phrases with no
//      recording (quality then depends on the device's Arabic voice).
let manifestPromise = null;
function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/audio/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

// One shared element so a new click cancels the clip already playing.
const player = typeof Audio !== 'undefined' ? new Audio() : null;

function pickArabicVoice() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  return (
    voices.find((v) => /^ar/i.test(v.lang)) ||
    voices.find((v) => /arab/i.test(v.name)) ||
    null
  );
}

function speakSynth(text) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  u.rate = 0.8; // a touch slower — these are teaching examples
  const v = pickArabicVoice();
  if (v) u.voice = v;
  try {
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {
    /* no-op */
  }
}

async function speak(text) {
  if (!text) return;
  const key = text.normalize('NFC');
  const manifest = await loadManifest();
  const file = manifest[key];
  if (file && player) {
    try {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      player.src = '/audio/' + file;
      await player.play();
      return;
    } catch (e) {
      /* recording failed to load/play — fall through to synthesis */
    }
  }
  speakSynth(text);
}

// Warm the voice list (some browsers populate it asynchronously).
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {};
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-speak]');
  if (!btn) return;
  e.preventDefault();
  const text = btn.getAttribute('data-speak') || btn.textContent || '';
  void speak(text.trim());
  btn.classList.add('is-speaking');
  setTimeout(() => btn.classList.remove('is-speaking'), 600);
});

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-speak]')) return;
  // Fetch the manifest ahead of the first click so playback starts instantly.
  loadManifest().then((manifest) => {
    // With neither recordings nor speech synthesis available, hide pronounce
    // buttons so they don't mislead.
    if (!('speechSynthesis' in window) && !Object.keys(manifest).length) {
      document.querySelectorAll('[data-speak]').forEach((el) => {
        el.setAttribute('hidden', '');
      });
    }
  });
});
