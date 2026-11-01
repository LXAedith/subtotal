/// <reference types="vitest/config" />
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// The privacy promise, enforced by the browser: with `connect-src 'self'` this page
// cannot send your statement anywhere, even if a dependency tried to. Only added to
// production builds because the dev server needs inline scripts and a websocket.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "connect-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "subtotal-csp",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      ),
  };
}

/** Emits sw.js with every built file precached, so the whole app works offline after one visit. */
function serviceWorker(): Plugin {
  return {
    name: "subtotal-sw",
    apply: "build",
    generateBundle(_, bundle) {
      // index.html and public/ files are not in the bundle at this point, so list them explicitly.
      const extra = ["index.html", "icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "manifest.webmanifest"];
      const names = new Set([...Object.keys(bundle).filter((name) => !name.endsWith(".map")), ...extra]);
      const files = ["./", ...[...names].map((name) => `./${name}`)];
      const template = readFileSync(new URL("./src/sw-template.js", import.meta.url), "utf8");
      const version = createHash("sha256").update(template + files.join("\n")).digest("hex").slice(0, 10);
      const source = template
        .replaceAll("__VERSION__", version)
        .replaceAll("__FILES__", JSON.stringify(files, null, 2));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  // Relative paths so the build works on GitHub Pages under /<repo>/ and from any folder.
  base: "./",
  plugins: [contentSecurityPolicy(), serviceWorker()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 4000,
  },
  test: {
    environment: "node",
  },
});
