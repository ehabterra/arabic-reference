import Prism from 'prismjs';

// prismjs language components (e.g. `prismjs/components/prism-go`) are authored
// as IIFEs that reference a *global* `Prism` and do `Prism.languages.go = …`.
// That works with a <script> tag, but under Vite/Rollup production bundling the
// language component gets split into its own chunk with no access to the core
// module's `Prism` binding — so at island-hydration time it throws
// `ReferenceError: Prism is not defined` (chunk name like `prism-go.*.js`).
//
// Fix: expose Prism on the global first, THEN load the language — and do the
// load at runtime via dynamic import so the ordering is guaranteed no matter
// how the bundler chunks things (a static side-effect import can be hoisted
// above this assignment; a runtime import cannot).
let promise: Promise<typeof Prism> | null = null;

export function loadGo(): Promise<typeof Prism> {
  if (!promise) {
    (globalThis as unknown as { Prism?: typeof Prism }).Prism = Prism;
    promise = import('prismjs/components/prism-go')
      .then(() => Prism)
      .catch((err) => {
        // Don't cache the rejection — clear it so a later call can retry
        // (transient network / missing-chunk failures shouldn't be permanent).
        promise = null;
        throw err;
      });
  }
  return promise;
}

// Highlight Go, degrading to plain text until the language component has loaded.
export function highlightGo(code: string): string {
  return Prism.languages.go ? Prism.highlight(code, Prism.languages.go, 'go') : code;
}

export { Prism };
