/* Per-page view counter. Increments once per browser session (so a reload or
   re-visit within the same session doesn't inflate the count), and otherwise
   reads the edge-cached total. Renders into the [data-dp-views] element that
   PageLayout puts in the sidebar. Fails silently when the API is unavailable. */

function initViews() {
  const el = document.querySelector('[data-dp-views]');
  if (!el) return;
  const page = el.getAttribute('data-dp-views') || '';
  if (!page) return;
  const numEl = el.querySelector('[data-dp-views-num]');
  const sessionKey = 'dp-viewed:' + page;

  // first hit this session → count it (POST); afterwards just read (GET).
  let counted = false;
  try { counted = sessionStorage.getItem(sessionKey) === '1'; } catch {}

  const req = counted
    ? fetch('/api/views?page=' + encodeURIComponent(page))
    : fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page }),
      });

  req
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!counted) { try { sessionStorage.setItem(sessionKey, '1'); } catch {} }
      const n = data && typeof data.count === 'number' ? data.count : null;
      if (n == null || !numEl) return;
      numEl.textContent = n.toLocaleString(document.documentElement.lang || undefined);
      el.hidden = false;
    })
    .catch(() => {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initViews);
else initViews();
