// Pronounce Arabic text aloud. Any element with [data-speak="..."] becomes a
// clickable pronounce trigger. Two tiers:
//   1. Pre-recorded clips (SILMA TTS) shipped under /audio/, looked up in
//      /audio/manifest.json — keyed by the exact phrase, NFC-normalized.
//   2. The browser's built-in speech synthesis as fallback for phrases with no
//      recording (quality then depends on the device's Arabic voice).
//
// iOS/iPadOS Safari drove the shape of this file (see git blame): it consumes
// the transient user-activation across an `await`, so a clip can only start if
// player.play() is called *synchronously* inside the click handler — never
// after awaiting the manifest fetch. It also keeps pages (and the global
// speechSynthesis queue) alive in its back/forward cache, so sound has to be
// stopped on pagehide or a clip bleeds onto the next page.
let manifest = null; // resolved manifest object, once the fetch settles
let manifestPromise = null;
function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/audio/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((m) => (manifest = m || {}));
  }
  return manifestPromise;
}

// One shared element so a new click cancels the clip already playing.
const player = typeof Audio !== 'undefined' ? new Audio() : null;
// The phrase behind the clip currently loaded into `player`, so a genuine media
// error (missing/corrupt file) can fall back to synthesis for the same text.
let currentText = '';

// Stop everything currently making sound: the shared clip and any queued or
// active browser speech. Called before every new trigger and whenever the page
// is hidden, so nothing overlaps across taps or bleeds across page navigations.
function stopAll() {
  currentText = '';
  if (player) {
    try {
      player.pause();
    } catch (e) {
      /* no-op */
    }
  }
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();
    } catch (e) {
      /* no-op */
    }
  }
}

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

// Synchronous — MUST be reachable from within a click handler without an
// intervening await, or iOS blocks the clip. If a recording exists we play
// ONLY the recording; the browser voice is a fallback for phrases with no clip,
// never a second voice layered on top (that was the "both voices" bug).
function speak(text) {
  if (!text) return;
  const key = text.normalize('NFC');
  const file = manifest ? manifest[key] : null;
  stopAll();
  if (file && player) {
    currentText = text;
    player.src = '/audio/' + file;
    const p = player.play();
    // iOS can reject this promise (AbortError/NotAllowedError) even while the
    // audio starts — so a rejection here is swallowed, NOT treated as failure.
    // Real load/decode failures surface on the element's 'error' event below.
    if (p && typeof p.catch === 'function') p.catch(() => {});
    return;
  }
  speakSynth(text);
}

// A true media error (missing or corrupt clip) is the only reason to substitute
// the browser voice for a phrase that had a recording.
if (player) {
  player.addEventListener('error', () => {
    const text = currentText;
    if (text) {
      currentText = '';
      speakSynth(text);
    }
  });
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
  const text = (btn.getAttribute('data-speak') || btn.textContent || '').trim();
  if (!text) return;
  // Play within the click gesture when the manifest is already loaded (the
  // common case — it's prefetched on DOMContentLoaded). Only the rare
  // first-tap-before-prefetch path awaits, and it degrades to synthesis on iOS.
  if (manifest) {
    speak(text);
  } else {
    loadManifest().then(() => speak(text));
  }
  btn.classList.add('is-speaking');
  setTimeout(() => btn.classList.remove('is-speaking'), 600);
});

// Safari's back/forward cache keeps this page — and the browser's global speech
// queue — alive after you navigate away. Stop all sound when the page hides so a
// clip or utterance never resumes or plays over an unrelated page.
window.addEventListener('pagehide', stopAll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAll();
});

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-speak]')) return;
  // Fetch the manifest ahead of the first click so playback starts instantly.
  loadManifest().then((m) => {
    // With neither recordings nor speech synthesis available, hide pronounce
    // buttons so they don't mislead.
    if (!('speechSynthesis' in window) && !Object.keys(m || {}).length) {
      document.querySelectorAll('[data-speak]').forEach((el) => {
        el.setAttribute('hidden', '');
      });
    }
  });
});
