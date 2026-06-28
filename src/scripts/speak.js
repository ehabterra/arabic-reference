// Pronounce Arabic text aloud using the browser's built-in speech synthesis.
// Any element with [data-speak="..."] becomes a clickable pronounce trigger —
// no audio hosting, no network. Quality depends on the device's Arabic voice.
function pickArabicVoice() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  return (
    voices.find((v) => /^ar/i.test(v.lang)) ||
    voices.find((v) => /arab/i.test(v.name)) ||
    null
  );
}

function speak(text) {
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
  speak(text.trim());
  btn.classList.add('is-speaking');
  setTimeout(() => btn.classList.remove('is-speaking'), 600);
});

// If speech synthesis is unavailable, hide pronounce buttons so they don't mislead.
if (!('speechSynthesis' in window)) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-speak]').forEach((el) => {
      el.setAttribute('hidden', '');
    });
  });
}
