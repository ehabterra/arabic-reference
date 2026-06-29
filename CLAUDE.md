# CLAUDE.md — working guide for this repo

> Read this before editing. It is the contract a fresh Claude needs to make changes
> that build, render, and stay bilingual. `README.md` is the public tour; `STRUCTURE.md`
> is a shorter map. This file is the deep one — when they disagree, trust this file and
> the code it points at.

---

## 1. What this project is

**تعلم العربية / Learn Arabic** — an interactive, **Arabic-first (RTL)** reference for the
Arabic language sciences (reading, grammar, morphology, rhetoric, tajwid, calligraphy, and
Arabic-through-the-Qur'an). Every lesson is **bilingual**: Arabic is the base, English is an
overlay a reader toggles at runtime (the whole UI + lesson body + titles + quizzes flip
between عربي and EN, and the page direction flips RTL↔LTR).

- **Stack:** Astro 5 + MDX, React only for a few interactive "islands", Cloudflare Worker
  (SSR via `@astrojs/cloudflare`) for the `/api/*` endpoints, Cloudflare **D1** for
  comments/likes/progress/sessions.
- **Rendering:** content pages are prerendered to static HTML (`getStaticPaths`); only the
  `/api/*` routes run on the Worker (`export const prerender = false`).
- **Origin:** this repo was scaffolded from a sibling `go-reference` project. The UI/build
  infra is inherited; the domain (Arabic) and direction (RTL) are the real differences.
  Expect occasional **dead leftovers** from that lineage (see §10) — don't mistake them for
  live features.

---

## 2. Commands

```bash
pnpm dev      # http://localhost:4321  (Miniflare proxies D1 bindings in dev)
pnpm build    # astro build  +  scripts/build-search-index.mjs  +  scripts/write-assetsignore.mjs
pnpm preview  # serve the production build
pnpm wrangler deploy   # deploy the Worker (after pnpm build)
```

**`pnpm build` is the real correctness gate.** It type-checks the MDX, validates *every*
lesson's front matter against the Zod schema in `src/content.config.ts` (a bad/missing field
fails the whole build), then rebuilds the full-text search index from the rendered HTML. Run
it after any content or component change. A green `pnpm dev` is necessary but not sufficient —
some failures (schema, the react-edge alias in §10) only surface in `build`.

---

## 3. Repo map

```
src/
  content/<track>/*.mdx     The lessons. One folder per track. Front matter + bilingual body.
  content.config.ts         Zod schema + the 7 collections. SOURCE OF TRUTH for front matter.
  pages/
    index.astro             Home hub (track picker, resume card, progress, features).
    <track>/index.astro     Track landing page (category grid).
    <track>/[...slug].astro Lesson route — thin; delegates to PageLayout.
    glossary / highlights / review .astro   Standalone tool pages.
    api/*.ts                Worker endpoints (SSR): comments, auth, likes, progress, state,
                            highlight-stats, run. All `prerender = false`, all hit D1.
  layouts/
    BaseLayout.astro        HTML shell: <head>, fonts, Nav/Footer, ⌘K palette, the inline
                            search index, the en.json i18n dict, client script imports.
    PageLayout.astro        Per-lesson anatomy: breadcrumb, PageHeader, body <slot/>, TOC,
                            like button, quiz, related, pager, comments.
  components/               .astro UI pieces (see §7) + islands/*.tsx (React).
  scripts/                  CLIENT runtime JS (ships to browser): ui, progress, highlights,
                            speak, mermaid, review.
  lib/                      Server/shared helpers: consts, auth, reading-time, *-store.js,
                            social-db, i18n-client, state-sync, visitor.
  i18n/
    en.json                 LIVE. UI chrome overlay dict (98 keys). Imported by BaseLayout.
    ar.json                 DEAD legacy (558 keys, go-reference vocab). Nothing imports it.
  styles/global.css         All styling + theme tokens (--dp-*) + RTL/LTR + lang toggling.
scripts/                    BUILD-time node tooling (not shipped): build-search-index.mjs,
                            write-assetsignore.mjs (both in `pnpm build`); extract-i18n.mjs,
                            build-ar.mjs (DORMANT — see §5).
sources/                    Private study digests (with citations) the lessons are authored
                            from. The source textbooks themselves are NOT in the repo.
public/                     favicon, _headers (immutable cache for /_astro/*).
wrangler.jsonc              Worker config + D1 binding `DB`.
astro.config.mjs            Integrations, Cloudflare adapter, heading-id rehype plugin, Shiki.
```

---

## 4. The bilingual system — read this twice

Three **independent** mechanisms carry translation. Know which one you're touching.

### 4a. Lesson front matter — `_en` sibling fields
Arabic fields are required; each has an optional `_en` twin. Components render the Arabic and
**fall back to Arabic when the `_en` is missing** — so a missing `_en` doesn't error, it
silently shows Arabic to English readers. Keep `_en` coverage 100% on `status: ready` lessons.
Fields: `title`/`title_en`, `intent`/`intent_en`, and per-quiz `q`/`q_en`, option
`text`/`text_en`, `explain`/`explain_en`. (See the schema, §6.)

### 4b. Lesson body — two `data-lang-block` divs
Every lesson body is authored as **two sibling divs**, each a *complete* version of the lesson:

```mdx
<div data-lang-block="ar">

## العنوان بالعربية
…full Arabic lesson: prose, tables, Mermaid, examples…

</div>

<div data-lang-block="en">

## English heading
…full English lesson: same structure, keep the Arabic examples + transliteration…

</div>
```

CSS in `global.css` shows exactly one block per active language (`html[data-lang="en"]` hides
`[data-lang-block="ar"]` and vice-versa) and flips text-align. **The two blocks are
independent** — they do NOT need matching block counts or 1:1 structure. Write each language
naturally. The same `data-lang-block="ar"/"en"` attribute is also used for short inline pairs
inside chrome and component captions (e.g. `<span data-lang-block="ar">…</span><span
data-lang-block="en">…</span>`).

### 4c. UI chrome — `data-i18n` keys + `en.json`
Static UI strings (nav, buttons, breadcrumbs labels, palette hints, homepage features) are
written in **Arabic directly in the markup** as the base, tagged `data-i18n="some.key"`.
`BaseLayout` injects `src/i18n/en.json` as the `#dp-i18n` script; `ui.js` (`initLang`) swaps
each tagged node's text to the English value on toggle, and restores the cached Arabic on
toggle-back. There is also `data-i18n-html` for nodes whose value is HTML.

To add/edit a chrome string: put the Arabic in the `.astro` as the element text, add
`data-i18n="namespace.name"`, and add the matching key → English in `src/i18n/en.json`. If
you forget the en.json key, the element just stays Arabic in English mode (no error).
Keep `en.json` valid JSON — `pnpm build` won't catch a *missing* key, only invalid JSON.

### ⚠️ The dormant body-translation pipeline — do not be fooled
You will find machinery for a *different*, older approach: `PageLayout` reads
`src/i18n/content/<id>.json` into `#dp-content-ar`; `ui.js` reads `#dp-content-en` and an
`i18nBlocks()` collector; `scripts/extract-i18n.mjs` + `scripts/build-ar.mjs` generate those
per-block JSON files. **This pipeline is inactive:** `src/i18n/content/` does not exist (so the
array is always empty), the inject/read element ids don't even match (`-ar` vs `-en`), and
`extract-i18n.mjs` still points at a stale `.vercel/output` path. Body translation today is
done entirely by the §4b two-div pattern. Don't wire new work into the dormant pipeline, and
don't "fix" the id mismatch unless you're deliberately reviving it.

---

## 5. The seven tracks (folder ↔ collection ↔ route)

Routes use hyphens; **the Qur'an track's three names differ** — folder `quran-arabic/`,
collection key `quranArabic`, public route `/arabic-via-quran/`. Get all three right.

| Folder (`src/content/`) | Collection key | Route                 |
|-------------------------|----------------|-----------------------|
| `qiraa/`                | `qiraa`        | `/qiraa/`             |
| `nahw/`                 | `nahw`         | `/nahw/`              |
| `sarf/`                 | `sarf`         | `/sarf/`              |
| `balagha/`              | `balagha`      | `/balagha/`           |
| `tajwid/`               | `tajwid`       | `/tajwid/`            |
| `khat/`                 | `khat`         | `/khat/`              |
| `quran-arabic/`         | `quranArabic`  | `/arabic-via-quran/`  |

Each track has a `[...slug].astro` (lists the collection via `getStaticPaths`, renders the
MDX `<Content/>` inside `PageLayout`) and an `index.astro` (category grid). Track titles,
blurbs, and the **category lists** (bilingual labels) live in `src/lib/consts.ts` (`TRACKS`).

---

## 6. Content model (the schema)

`src/content.config.ts` defines one Zod schema shared by all 7 collections. Required vs.
optional matters — the build rejects a lesson missing a required field.

```yaml
---
title: "عنوان الدرس"           # required
title_en: "Lesson Title"        # optional (fill on ready lessons)
category: <enum key>            # required — MUST be one of the keys in the schema enum
kind: pattern | guide | topic   # optional, default "pattern" — drives the PageHeader eyebrow
order: 20                       # required integer — sorts within the category & track
difficulty: "مبتدئ"            # required string (free text, e.g. مبتدئ / متوسط / متقدّم)
status: stub | ready            # optional, default "stub" — non-ready renders a DraftScaffold
intent: "جملة واحدة تصف الهدف."  # required — the lede shown under the H1
intent_en: "One-sentence English lede."   # optional
nutshell / aka / source / playground:     # optional extras (some are go-reference leftovers)
related: ["slug-a", "slug-b"]  # optional — ids of sibling lessons; renders a Related block
when_use: []                   # optional string[]
when_avoid: []                 # optional string[]
sources:                       # optional — citations, shown in the page
  - book: "اسم الكتاب"
    page: "٤٥"                 # optional
quiz:                          # optional — renders QuizBlock; options shuffled at runtime
  - q: "السؤال بالعربية"
    q_en: "The question in English"
    options:
      - text: "خيار"
        text_en: "option"
        correct: true          # author puts the CORRECT option first; ui.js shuffles them
    explain: "تعليل بالعربية"
    explain_en: "English explanation"
---
```

`category` enum keys (grouped by track, all defined in `content.config.ts`): `huruf, harakat,
tarkib` · `kalam, marfuaat, mansubat, majrurat, tawabi, asalib` · `mizan, afaal, mushtaqqat` ·
`maani, bayan, badi, balaghaq` · `makharij, ahkam, tilawa` · `usus, naskh, ruqaa,
khutut_okhra` · `mustawa1, mustawa2, mustawa3, qiraaq, alfaz`. **A new category must be added
to the enum first**, or the build fails on the first lesson that uses it.

---

## 7. Components & where they're used

**Author-facing (import these inside an `.mdx` body):**
- `Mermaid.astro` — `<Mermaid code={String.raw`flowchart TD …`} />`. Use **`String.raw`** so
  newlines are literal, not `\n`. Rendered client-side by `scripts/mermaid.js`; styling is
  themed. This is the only component in ~every lesson.
- `Calligraphy.astro` (`khat` lessons) — original hand-built line-art **SVGs** for pen
  technique (no copyrighted images); colors use `var(--dp-*)` tokens so they work in
  light/dark. Kinds: `nib-angle` (prop `angle`), `nib-cut`, `dot-measure` (prop `dots`),
  `grip`, `posture`. Label with `script`/`scriptEn`, e.g.
  `<Calligraphy kind="nib-angle" angle={45} script="النسخ" scriptEn="Naskh" />`.

Import components **after** the front-matter `---`, before the `data-lang-block` divs. You can
also use plain HTML/markdown and existing CSS classes in the body (e.g. `<div class="khat-card">`).
Quizzes are authored in **front matter**, not as a body component.

**Layout-level (you rarely touch; injected by `PageLayout`/pages, not imported in MDX):**
`PageHeader` (hero: title/intent/badges/eyebrow), `QuizBlock`, `Related`, `Pager`,
`DraftScaffold` (shown when `status !== ready`), `Tradeoffs`, `Comments`, `Card` /
`CategorySection` / `Feature(s)` / `SkillTree` / `Callout` (Callout exists but no lesson
currently imports it), `Nav`, `Footer`. React islands in `components/islands/`:
`LikeButton.tsx` (used), `Playground.tsx` / `Challenge.tsx` (go-reference leftovers, dormant).

---

## 8. How a lesson renders (request → HTML)

1. `src/pages/<track>/[...slug].astro` enumerates the collection with `getStaticPaths` and
   `render()`s the MDX into `<Content/>`, passing track props.
2. `PageLayout.astro` builds the page anatomy: breadcrumb → `PageHeader` (from front matter) →
   `<slot/>` (your two `data-lang-block` divs) → DraftScaffold (if not ready) → Tradeoffs →
   Related → QuizBlock → Pager → Comments; plus a sticky TOC + LikeButton + "mark learned".
3. `BaseLayout.astro` wraps it: `<head>` (title `"<lesson> · تعلم العربية"`, meta/OG, fonts),
   the pre-paint inline script that restores persisted `dp-lang`/`dp-theme` before first
   paint, Nav/Footer, the ⌘K palette, the inline `#dp-search-index` (titles/intent) and
   `#dp-i18n` (en.json), then imports the client scripts.
4. `astro.config.mjs` gives every `h2–h4` a stable slug `id` at build time (rehype plugin)
   so `#anchor` deep links resolve on first paint. **That slug rule must stay in sync with
   `slugify()` in `scripts/progress.js`** (the runtime TOC fallback).

---

## 9. Client scripts & search

Client runtime lives in `src/scripts/` (imported at the bottom of `BaseLayout`):
- `ui.js` — language toggle (`initLang`, `localStorage` key `dp-lang`), theme toggle,
  the ⌘K command palette, quiz-option shuffle, external-link targeting, search-hit
  highlighting. The hub of UX behavior.
- `progress.js` — per-lesson "learned" state, milestone detection, TOC build (`slugify`),
  quiz scoring, reading progress bar. State in `localStorage`, optionally synced via `/api`.
- `highlights.js` — user text highlights (the highlights page).
- `speak.js` — browser TTS pronunciation. `review.js` — spaced-review session.

**Search is two-tier:** `BaseLayout` ships an inline `#dp-search-index` (titles + intent +
category, instant) and `build-search-index.mjs` writes `dist/search-index.json` (full body
text, section-deep-linked) which `ui.js` lazy-`fetch`es on first palette open. If body search
seems stale, rerun `pnpm build`.

---

## 10. Gotchas & dead leftovers

- **`node_modules` must be a real local install, never a symlink.** It was once symlinked to a
  sibling `go-reference/node_modules`; that made `pnpm dev` serve assets through a path Vite
  rejected with **HTTP 403**. If dev 403s on assets: confirm `node_modules` is a directory,
  delete it if it's a symlink, `pnpm install`.
- **Editing Arabic with shell tools:** BSD `sed`/`perl` on macOS can mangle UTF-8 (silent
  double-encoding / mojibake). Prefer the `Edit`/`Write` tools for Arabic text. If you must
  script it, use `perl -CSD` with **`\x{....}` hex escapes for both pattern and replacement**,
  and verify with a `hexdump`/grep afterward.
- **Qur'an track triple-name** mismatch (`quran-arabic/` ↔ `quranArabic` ↔ `/arabic-via-quran/`).
- **New `category`** values must be added to the enum in `content.config.ts` before use.
- **`react-dom/server` edge alias** (`astro.config.mjs`): a build-only Vite alias forces the
  `server.edge` build so SSR doesn't crash under workerd (`MessageChannel` missing). Don't
  remove it; it's intentionally build-only (dev uses the Node build).
- **Dormant go-reference leftovers** — present but not live: the `i18n/content` body-translation
  pipeline + `extract-i18n.mjs`/`build-ar.mjs` (§4); `src/i18n/ar.json` (unused, stale vocab);
  the `Playground`/`Challenge` React islands and `playground`/`source` front-matter fields and
  `/api/run.ts` (Go-playground heritage). Some UI copy may still mention "Go Playground". Treat
  these as inert unless a task is explicitly about reviving them.
- **`sources/` is private** study material; never reproduce the source textbooks in lessons —
  cite them via the `sources:` front-matter array.

---

## 11. Adding a lesson — checklist

1. Create `src/content/<track>/<slug>.mdx`. Fill **required** front matter (§6); add `_en`
   twins and set `status: ready` when complete.
2. Body: two `data-lang-block` divs (§4b), each a full version. Import `Mermaid` (and
   `Calligraphy` for khat) after the `---`.
3. Use a real lesson as the template — `src/content/nahw/aqsam-al-kalam.mdx`.
4. (Optional) add `related:` ids, `quiz:` (correct option first), `sources:`.
5. `pnpm build` — green build means schema-valid and indexed. The lesson auto-appears in its
   track grid, the search index, progress tracking, and the resume card. No registration step.

## 12. House rules for changes

- Match the surrounding code's idiom, comment density, and naming. These files are already
  heavily and intentionally commented — keep that style.
- Touching chrome text? Update **both** the Arabic base (in markup) and the `en.json` key.
- Touching a lesson? Keep AR and EN bodies in sync in meaning, and keep `_en` front-matter
  coverage complete for `ready` lessons.
- `main` is protected — pushes go through a PR (`git push -u origin <branch>` then open a PR).
- Always finish with `pnpm build` and report its result honestly.
