import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Shared schema for every Arabic reference section.
const refSchema = z.object({
  title: z.string(),
  category: z.enum([
    // qiraa categories
    'huruf',
    'harakat',
    'tarkib',
    // nahw categories
    'marfuaat',
    'mansubat',
    'majrurat',
    'jumal',
    // sarf categories
    'mizan',
    'afaal',
    'mushtaqqat',
    // balagha categories
    'maani',
    'bayan',
    'badi',
    // tajwid categories
    'makharij',
    'ahkam',
    'tilawa',
    // khat categories
    'usus',
    'ruqaa',
    'naskh',
    // quran-arabic categories
    'alfaz',
    'nahwq',
    'balaghaq',
    // nonnative categories
    'asasiyat',
    'qawaid',
    'mufradat',
  ]),
  kind: z.enum(['pattern', 'guide', 'topic']).default('pattern'),
  order: z.number(),
  difficulty: z.string(),
  gof: z.boolean().default(false),
  status: z.enum(['stub', 'ready']).default('stub'),
  intent: z.string(),
  nutshell: z.string().optional(),
  aka: z.string().optional(),
  source: z.string().optional(),
  playground: z.string().optional(),
  related: z.array(z.string()).default([]),
  when_use: z.array(z.string()).default([]),
  when_avoid: z.array(z.string()).default([]),
  sources: z.array(z.object({ book: z.string(), page: z.string().optional() })).default([]),
  quiz: z
    .array(
      z.object({
        q: z.string(),
        options: z.array(
          z.object({
            text: z.string(),
            correct: z.boolean().default(false),
          }),
        ),
        explain: z.string().optional(),
      }),
    )
    .default([]),
});

const qiraa = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/qiraa' }),
  schema: refSchema,
});

const nahw = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/nahw' }),
  schema: refSchema,
});

const sarf = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sarf' }),
  schema: refSchema,
});

const balagha = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/balagha' }),
  schema: refSchema,
});

const tajwid = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tajwid' }),
  schema: refSchema,
});

const khat = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/khat' }),
  schema: refSchema,
});

const quranArabic = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/quran-arabic' }),
  schema: refSchema,
});

const nonnative = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/nonnative' }),
  schema: refSchema,
});

export const collections = { qiraa, nahw, sarf, balagha, tajwid, khat, quranArabic, nonnative };
