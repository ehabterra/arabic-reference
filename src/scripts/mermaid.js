/* Lazily render Mermaid diagrams only on pages that contain them. */
let mermaidImport = null;

async function renderMermaid() {
  const nodes = document.querySelectorAll('pre.mermaid');
  if (!nodes.length) return;
  // Keep the source so a theme toggle can re-render from scratch. NB: must NOT
  // be `data-src` — Prism's file-highlight plugin (bundled with the playground)
  // treats any `<pre data-src>` as a file URL to fetch, which fails noisily
  // ("File does not exist or is empty") on the diagram text.
  nodes.forEach((n) => {
    if (!n.dataset.mermaidSrc) n.dataset.mermaidSrc = n.textContent;
  });
  const { default: mermaid } = await (mermaidImport ??= import('mermaid'));
  const light = document.documentElement.dataset.theme === 'light';
  mermaid.initialize({
    startOnLoad: false,
    theme: light ? 'base' : 'dark',
    securityLevel: 'loose',
    fontFamily: '"IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif',
    themeVariables: light
      ? {
          primaryColor: '#fffdf7',
          primaryTextColor: '#221d14',
          primaryBorderColor: '#157a6e',
          lineColor: '#9c7c1a',
          secondaryColor: '#f4ecdb',
          tertiaryColor: '#f6efe0',
          fontSize: '15px',
        }
      : {
          primaryColor: '#1b2a23',
          primaryTextColor: '#f1ece0',
          primaryBorderColor: '#28b89a',
          lineColor: '#d8b24a',
          secondaryColor: '#25372d',
          tertiaryColor: '#142019',
          fontSize: '15px',
        },
  });
  await mermaid.run({ nodes });
}

// theme toggled: restore each diagram's source and render in the new palette
window.addEventListener('dp:theme', () => {
  const nodes = document.querySelectorAll('pre.mermaid');
  if (!nodes.length) return;
  nodes.forEach((n) => {
    if (n.dataset.mermaidSrc) {
      n.removeAttribute('data-processed');
      n.textContent = n.dataset.mermaidSrc;
    }
  });
  renderMermaid();
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderMermaid);
else renderMermaid();
