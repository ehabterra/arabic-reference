# Arabic Reference — Project Structure

## Overview

This site is scaffolded from the `go-reference` Astro infra. The UI, components,
scripts, and build pipeline are identical; only the **content domain** and **language
direction** differ.

- **Default language / direction:** Arabic (RTL) — `<html lang="ar" dir="rtl">`
- **Optional English overlay:** when `localStorage.getItem('dp-lang') === 'en'` the
  runtime switches to LTR (`lang="en" dir="ltr"`).
- **Arabic font:** Noto Naskh Arabic loaded from Google Fonts alongside Inter and
  JetBrains Mono.

---

## The 7 Tracks

| # | Track key      | Route            | Title                  | Categories (keys)                                      |
|---|----------------|------------------|------------------------|--------------------------------------------------------|
| 1 | `qiraa`        | `/qiraa/`        | القراءة والكتابة       | huruf, harakat, tarkib                                 |
| 2 | `nahw`         | `/nahw/`         | النحو                  | kalam, marfuaat, mansubat, majrurat, tawabi, asalib    |
| 3 | `sarf`         | `/sarf/`         | الصرف                  | mizan, afaal, mushtaqqat                               |
| 4 | `balagha`      | `/balagha/`      | البلاغة                | maani, bayan, badi, balaghaq                           |
| 5 | `tajwid`       | `/tajwid/`       | التجويد                | makharij, ahkam, tilawa                                |
| 6 | `khat`         | `/khat/`         | الخط العربي            | usus, naskh, ruqaa, khutut_okhra                       |
| 7 | `quranArabic`  | `/quran-arabic/` | عربية القرآن           | mustawa1, mustawa2, mustawa3, qiraaq, alfaz            |

**Taxonomy notes:**
- The former `nonnative` track (8th track) has been **merged into `quranArabic`**, which
  is restructured as a leveled course (مبتدئ → متوسط → متقدّم) that also serves
  non-native Arabic learners.
- `balaghaq` (بلاغة القرآن التطبيقية) is now a category under `balagha`, not under
  `quranArabic`.
- `usus` under `khat` now covers both calligraphy fundamentals and handwriting basics.
- `khutut_okhra` is a new `khat` category covering Farsi/Diwani and other artistic scripts.

---

## Where Content Lives

```
src/content/
  qiraa/          ← القراءة والكتابة lessons
  nahw/           ← النحو lessons
  sarf/           ← الصرف lessons
  balagha/        ← البلاغة lessons  (incl. balaghaq category)
  tajwid/         ← التجويد lessons
  khat/           ← الخط العربي lessons  (incl. khutut_okhra category)
  quran-arabic/   ← عربية القرآن lessons (collection key: quranArabic)
                     levels: mustawa1 / mustawa2 / mustawa3 / qiraaq / alfaz
```

Each file is `.md` or `.mdx` with frontmatter validated by `src/content.config.ts`.

---

## Adding a Lesson

1. Create a `.mdx` file in the appropriate `src/content/<track>/` directory.
2. Fill in the required frontmatter:

```yaml
---
title: "عنوان الدرس"
category: <one of the 29 category keys>
order: <integer — controls sort order within the category>
difficulty: "ابدأ هنا"   # or any descriptive string
status: stub              # change to 'ready' when complete
intent: "جملة واحدة تصف هدف الدرس."
sources:
  - book: "اسم الكتاب"
    page: "٤٥"
---
```

3. The page is automatically included in the search index, progress tracking, and
   the category grid on the track index page.

---

## Pages Structure

```
src/pages/
  index.astro              ← Homepage — lists all 7 tracks
  review.astro             ← Spaced-repetition review session
  glossary.astro           ← Glossary page
  highlights.astro         ← Highlights page
  api/                     ← Cloudflare Worker endpoints (likes, progress, …)
  qiraa/
    index.astro            ← Track landing page
    [...slug].astro        ← Individual lesson page
  nahw/   (same pattern)
  sarf/
  balagha/
  tajwid/
  khat/
  quran-arabic/            ← route uses hyphen; collection key is quranArabic
```

---

## Key Config Files

| File | Purpose |
|------|---------|
| `src/content.config.ts` | Zod schema + collection definitions |
| `src/lib/consts.ts` | `TRACKS`, `SITE_TITLE`, `SITE_DESC`, `REPO_URL` |
| `src/layouts/BaseLayout.astro` | HTML shell, search index, RTL default |
| `astro.config.mjs` | Astro + Cloudflare adapter config (unchanged from go-reference) |

---

## Notes

- `node_modules` is a symlink to `/Users/ehab/Documents/go-reference/node_modules`
  to save disk space. Run `pnpm install` inside this directory if you need to
  install independently.
- The Cloudflare adapter, API routes, and Mermaid/playground infra are all
  inherited unchanged from go-reference and work identically.
