# CLAUDE.md — guide for working in this repo

The Arabic Reference: a **bilingual (Arabic-first, RTL), interactive** reference for the
Arabic language sciences, built with **Astro + MDX** and deployed as a Cloudflare Worker
(SSR via `@astrojs/cloudflare`). Arabic is the base language; English is an overlay toggled
at runtime. See `README.md` and `STRUCTURE.md` for the longer tour — this file is the
working contract for editing content and components.

## Commands

```bash
pnpm dev      # http://localhost:4321
pnpm build    # astro build + scripts/build-search-index.mjs + write-assetsignore.mjs → dist/
pnpm preview  # serve the production build
```

`pnpm build` is the real gate: it type-checks the MDX, validates every front-matter file
against the Zod schema, and rebuilds the search index. Run it after content/component edits.

## The seven tracks

One content collection per track. Routes use hyphens; the `quranArabic` collection is
served at `/arabic-via-quran/` (route) — its folder on disk is `src/content/quran-arabic/`.

| Folder (`src/content/`) | Collection key | Route             |
|-------------------------|----------------|-------------------|
| `qiraa/`                | `qiraa`        | `/qiraa/`         |
| `nahw/`                 | `nahw`         | `/nahw/`          |
| `sarf/`                 | `sarf`         | `/sarf/`          |
| `balagha/`              | `balagha`      | `/balagha/`       |
| `tajwid/`               | `tajwid`       | `/tajwid/`        |
| `khat/`                 | `khat`         | `/khat/`          |
| `quran-arabic/`         | `quranArabic`  | `/arabic-via-quran/` |

Category keys per track are enumerated in `src/content.config.ts`. Adding a new category
means adding it to the `category` enum there first, or the build fails.

## Bilingual authoring — the core convention

Every lesson is fully bilingual. Two layers carry the translation:

**1. Front matter** (`src/content.config.ts` is the source of truth). Arabic fields are
required; their `_en` counterparts are optional but should be filled for every `ready`
lesson:

```yaml
---
title: "عنوان الدرس"
title_en: "Lesson Title"
category: <one of the enum keys>
kind: pattern | guide | topic     # default: pattern
order: <integer, sorts within category>
difficulty: "مبتدئ"
status: stub | ready              # default: stub
intent: "جملة واحدة تصف الهدف."   # the lede under the H1
intent_en: "One-sentence English lede."
sources:
  - book: "اسم الكتاب"
    page: "٤٥"
quiz:
  - q: "السؤال بالعربية"
    q_en: "The question in English"
    options:
      - text: "خيار"
        text_en: "option"
        correct: true
    explain: "تعليل بالعربية"
    explain_en: "English explanation"
---
```

`PageHeader.astro` renders `title`/`intent` for Arabic and falls back to the Arabic when
`title_en`/`intent_en` are absent — so a missing `_en` silently shows Arabic to English
users. Keep `_en` coverage complete.

**2. Body** — wrap each language in a `data-lang-block`. `ui.js` shows exactly one block
for the active language:

```mdx
import Mermaid from '../../components/Mermaid.astro';

<div data-lang-block="ar">

## العنوان بالعربية
… الدرس بالعربية …

</div>

<div data-lang-block="en">

## English heading
… the same lesson in English, keeping Arabic examples + transliteration …

</div>
```

Inline bilingual spans (used inside shared components/captions) use the same attribute:
`<span data-lang-block="ar">…</span><span data-lang-block="en">…</span>`.

Template to copy: `src/content/nahw/aqsam-al-kalam.mdx`.

## Components used inside lessons

- **`Mermaid.astro`** — diagrams: `<Mermaid code={String.raw`flowchart TD …`} />`. Use
  `String.raw` so newlines are real, not `\n`.
- **`Calligraphy.astro`** (`khat` track) — original, hand-built line-art SVGs for pen
  technique; no copyrighted images. Colors use theme tokens (`var(--dp-*)`) so they work in
  light/dark. Kinds: `nib-angle` (takes `angle`), `nib-cut`, `dot-measure` (takes `dots`),
  `grip`, `posture`. Pass `script`/`scriptEn` to label which script, e.g.
  `<Calligraphy kind="nib-angle" angle={45} script="النسخ" scriptEn="Naskh" />`.

Import components after the front-matter `---`, before the language blocks.

## Adding a lesson

1. Create `src/content/<track>/<slug>.mdx` with the front matter above.
2. Write both language blocks; fill all `_en` fields if marking `status: ready`.
3. `pnpm build` — the lesson is auto-added to the search index, progress tracking, and the
   track's category grid. No registration step.

## Layout / app structure (rarely edited for content work)

- `src/layouts/BaseLayout.astro` — HTML shell, RTL default, search index wiring.
- `src/scripts/ui.js` — theme + Arabic/English language toggle (`localStorage` key `dp-lang`).
- `src/lib/consts.ts` — `TRACKS`, site metadata (bilingual).
- `src/pages/api/` — Cloudflare Worker endpoints (comments, auth/session, likes, progress).
- `wrangler.jsonc` — Worker config + D1 binding `DB` (comments/likes/sessions self-create tables).

## Gotchas

- **`node_modules` must be a real local install.** It was historically a symlink to a
  sibling `go-reference/node_modules`; that symlink made `pnpm dev` serve assets through a
  path Vite rejected with **HTTP 403**. If dev 403s on assets, check `node_modules` isn't a
  symlink — remove it and run `pnpm install`.
- Route vs. folder mismatch for the Qur'an track (`/arabic-via-quran/` ↔ `quran-arabic/`).
- New `category` values must be added to the enum in `src/content.config.ts`.
- The `sources/` directory holds private study digests the lessons are authored from; the
  source textbooks themselves are not reproduced in the repo.
