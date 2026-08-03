// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// Give every content heading (h2–h4) a stable, build-time `id` derived from
// its text, so deep links like `/stdlib/time#zones` resolve on first paint —
// before any client JS runs. The slug rule MUST match `slugify()` in
// src/scripts/progress.js so the runtime TOC fallback stays consistent.
function rehypeHeadingIds() {
  const slugify = (s) =>
    s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
  const toText = (node) =>
    node.type === 'text'
      ? node.value
      : (node.children || []).map(toText).join('');
  return (tree) => {
    const seen = new Map(); // base slug -> count, for de-duping repeats
    const walk = (node) => {
      for (const child of node.children || []) {
        if (
          child.type === 'element' &&
          /^h[2-4]$/.test(child.tagName) &&
          !child.properties?.id
        ) {
          const base = slugify(toText(child)) || 'section';
          const n = seen.get(base) || 0;
          seen.set(base, n + 1);
          child.properties = child.properties || {};
          child.properties.id = n ? `${base}-${n}` : base;
        }
        walk(child);
      }
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  // The production domain. `site` is not cosmetic: every canonical URL and
  // every <loc> in the sitemap is resolved against it, so pointing it at the
  // wrong host silently tells Google to index a domain that doesn't serve
  // this content (wrangler.jsonc sets `workers_dev: false` — the old
  // *.workers.dev value here never resolved at all).
  site: 'https://ar.ehabterra.com',
  // Only prerendered routes are enumerated, so the /api/* endpoints
  // (prerender = false) are excluded automatically. The filter is belt-and-
  // braces in case one is ever prerendered by accident.
  //
  // Match on the pathname rooted at /api/, not a substring of the whole URL:
  // a page id of `api` in any track (say /nahw/api/) contains "/api/" too, and
  // a substring test would silently drop it from the sitemap. This mirrors the
  // `Disallow: /api/` in public/robots.txt, which is also a root-anchored prefix.
  integrations: [
    mdx(),
    react(),
    sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/api/') }),
  ],
  adapter: cloudflare({
    // Expose wrangler.jsonc bindings (D1) under `astro dev` via Miniflare.
    platformProxy: { enabled: true },
    // This site uses no Astro <Image>/image transforms (only inline SVGs +
    // webfonts), so skip Cloudflare Images — avoids requiring an IMAGES binding.
    imageService: 'passthrough',
  }),
  markdown: {
    rehypePlugins: [rehypeHeadingIds],
    shikiConfig: {
      // Dual-theme output: colors come as --shiki-light/--shiki-dark CSS
      // vars (defaultColor:false), switched by [data-theme] in global.css.
      themes: { light: 'github-light', dark: 'github-dark-default' },
      defaultColor: false,
      wrap: false,
    },
  },
  vite: {
    resolve: {
      // @astrojs/react imports the bare `react-dom/server`, which resolves to
      // the `server.browser` build under workerd — that build references
      // `MessageChannel`, which the Workers runtime doesn't expose, so SSR
      // crashes at startup. Force the Web-Streams `server.edge` build instead.
      //
      // Build-only: `server.edge.js` is CommonJS and loads correctly under
      // workerd, but `astro dev` runs SSR in Node, where its `require` calls
      // throw "require is not defined". In dev we let `react-dom/server`
      // resolve to its Node build as usual.
      alias: process.argv.includes('build')
        ? { 'react-dom/server': 'react-dom/server.edge' }
        : {},
    },
  },
});
