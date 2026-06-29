# تعلم العربية · Learn Arabic 

A bilingual (Arabic‑first), interactive reference for learning the **Arabic language
sciences** — grammar, morphology, rhetoric, recitation, calligraphy, reading & writing,
and Arabic through the Qur'an. RTL‑first, with diagrams, pronunciation audio, quizzes,
highlights and progress tracking. Built with [Astro](https://astro.build) + MDX.

Every lesson is **bilingual**: Arabic is the base, with an English overlay for non‑Arabic
speakers learning Arabic (a toggle in the nav switches the whole UI, lesson bodies, titles
and quizzes between عربي and EN).

## Seven tracks

- **`/qiraa/`** — القراءة والكتابة — letters, vowels (ḥarakāt), madd, and connected reading (Nūr al‑Bayān method).
- **`/nahw/`** — النحو — grammar: iʿrāb, the nominatives/accusatives/genitives, followers (tawābiʿ), verbs & constructions.
- **`/sarf/`** — الصرف — morphology: the mīzān, verb forms, derivatives and plurals.
- **`/balagha/`** — البلاغة — rhetoric: maʿānī, bayān, badīʿ, and applied Qur'anic rhetoric.
- **`/tajwid/`** — التجويد — recitation: makhārij, ṣifāt, rules of nūn/mīm, and the mudūd.
- **`/khat/`** — الخط العربي — calligraphy: Naskh, Ruqʿa, and the artistic scripts.
- **`/arabic-via-quran/`** — العربية عبر القرآن — a graded course (beginner → advanced) for learners, including non‑natives.

## Features

- **Bilingual** content and chrome (Arabic base + English overlay).
- **Diagrams** (Mermaid), **pronunciation audio** (browser text‑to‑speech), and **calligraphic script samples** rendered with real Naskh/Ruqʿa/Kufi/Nastaliq webfonts.
- **Quizzes** (bilingual), **highlights**, **spaced review**, and **progress tracking** (saved per‑browser, optionally synced).
- **Comments** gated behind **Google sign‑in**, stored in Cloudflare **D1** with a first‑party session (no anonymous posts; sign in once, stays signed in).
- **Manuscript‑inspired design** — ink‑green + gold illumination, parchment light theme — and **RTL‑first** layout.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # build (output → dist/, including the SSR Worker)
pnpm preview  # serve the production build
```

### Configuration (`.env`)

```bash
# Comments: a Google OAuth Web Client ID (https://console.cloud.google.com/apis/credentials).
# Add your origin(s) under "Authorized JavaScript origins". Leave empty to disable comments.
PUBLIC_GOOGLE_CLIENT_ID=
```

See `.env.example`. Comments, likes and sessions use the Cloudflare **D1** binding `DB`
(`wrangler.jsonc`); their tables self‑create on first use.

## How it's organized

| Path | What |
|---|---|
| `src/content/<track>/*.mdx` | Lessons, one file each — one folder per track (`qiraa/`, `nahw/`, `sarf/`, `balagha/`, `tajwid/`, `khat/`, `quran-arabic/`). |
| `src/content.config.ts` | Shared front‑matter schema (incl. bilingual `title_en` and quiz `*_en`); one collection per track. |
| `src/pages/index.astro` | The home hub (track picker). |
| `src/pages/<track>/` | Each track's landing (`index.astro`) + lesson route (`[...slug].astro`). |
| `src/layouts/` | `BaseLayout` (chrome) and `PageLayout` (per‑lesson anatomy). |
| `src/components/` | UI pieces: `Card`, `PageHeader`, `Mermaid`, `QuizBlock`, `Comments`, … |
| `src/lib/consts.ts` | Site metadata + the tracks and categories (bilingual). |
| `src/lib/auth.ts` | Google verify + D1 session helpers. |
| `src/scripts/` | `progress.js` (progress/quiz/TOC), `mermaid.js`, `speak.js` (TTS), `ui.js` (theme + language toggle). |
| `src/pages/api/` | `comments.ts`, `auth.ts` (session), `likes.ts`, `progress.ts`, `state.ts`. |
| `sources/` | Private study digests synthesized from classical Arabic textbooks (with page citations) — what the lessons are authored from. The books themselves are **not** reproduced. |
| `wrangler.jsonc` | Cloudflare Worker config (entry, static assets, D1 binding). |

## Authoring a lesson

A lesson is a single `.mdx` file in `src/content/<track>/`. Front matter
(`title`, `title_en`, `category`, `order`, `difficulty`, `status`, `intent`, `sources`,
`quiz` with `q_en`/`text_en`/`explain_en`) drives the header, badges and quiz. Write the
body as two language blocks:

```mdx
import Mermaid from '../../components/Mermaid.astro';

<div data-lang-block="ar">

## العنوان بالعربية
… الدرس بالعربية مع الأمثلة والمخططات …

</div>

<div data-lang-block="en">

## English heading
… the lesson in English, keeping the Arabic examples + transliteration …

</div>
```

Use `<Mermaid code={String.raw`flowchart TD …`} />` for diagrams (real newlines, not `\n`).
See `nahw/aqsam-al-kalam.mdx` as the template.

## Deploy to Cloudflare Workers

The site runs as a Cloudflare Worker (SSR via `@astrojs/cloudflare`), static assets from `dist/`:

```bash
pnpm build
pnpm wrangler deploy
```

Provision a D1 database (`wrangler d1 create arabic-reference`, paste its `database_id` into
`wrangler.jsonc`) and set `PUBLIC_GOOGLE_CLIENT_ID` for comments. Connecting the GitHub repo
to Cloudflare CI (build `pnpm build`) deploys on push.

## Content status

Seven tracks, **88 bilingual lessons**:

| Track | Lessons |
|---|---|
| القراءة والكتابة (`/qiraa/`) | 8 |
| النحو (`/nahw/`) | 25 |
| الصرف (`/sarf/`) | 10 |
| البلاغة (`/balagha/`) | 11 |
| التجويد (`/tajwid/`) | 10 |
| الخط العربي (`/khat/`) | 6 |
| العربية عبر القرآن (`/arabic-via-quran/`) | 18 |

## License

Licensed under the [Apache License 2.0](./LICENSE) for the code. The lesson content is
original, synthesized from classical sources (cited per lesson); the source textbooks
themselves are not redistributed.
