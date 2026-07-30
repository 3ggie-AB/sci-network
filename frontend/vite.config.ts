// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

function generateSpaIndexPlugin() {
  return {
    name: "generate-spa-index",
    closeBundle() {
      const publicDir = path.resolve(__dirname, "../backend/public");
      const clientDir = path.join(publicDir, "client");

      if (!fs.existsSync(clientDir)) return;

      // Copy all contents of clientDir into publicDir
      fs.cpSync(clientDir, publicDir, { recursive: true });

      // Find CSS and JS assets
      const assetsDir = path.join(publicDir, "assets");
      if (!fs.existsSync(assetsDir)) return;

      const files = fs.readdirSync(assetsDir);
      const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css"));

      const jsFiles = files.filter((f) => f.endsWith(".js"));
      // Main bundle is the largest index-*.js file
      const mainJsFile = jsFiles
        .filter((f) => f.startsWith("index-"))
        .sort((a, b) => fs.statSync(path.join(assetsDir, b)).size - fs.statSync(path.join(assetsDir, a)).size)[0]
        || jsFiles.sort((a, b) => fs.statSync(path.join(assetsDir, b)).size - fs.statSync(path.join(assetsDir, a)).size)[0];

      // Read generated routes manifest from server build if available
      const serverAssetsDir = path.join(publicDir, "server/assets");
      let manifestStr = JSON.stringify({ routes: { __root__: { children: ["/", "/dashboard", "/login", "/register"] } } });

      if (fs.existsSync(serverAssetsDir)) {
        const serverFiles = fs.readdirSync(serverAssetsDir);
        const manifestFile = serverFiles.find((f) => f.includes("manifest"));
        if (manifestFile) {
          const content = fs.readFileSync(path.join(serverAssetsDir, manifestFile), "utf-8");
          const match = content.match(/tsrStartManifest\s*=\s*\(\)\s*=>\s*\(([\s\S]+?)\);/);
          if (match) {
            try {
              const parsed = Function(`return (${match[1]})`)();
              if (parsed) {
                manifestStr = JSON.stringify(parsed);
              }
            } catch (e) {
              console.error("[SPA Plugin] Manifest parse error:", e);
            }
          }
        }
      }

      if (cssFile && mainJsFile) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SCINetwork — Network Observability</title>
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="stylesheet" href="/assets/${cssFile}" />
    <script>
      window.$_TSR = {
        h: function() { this.hydrated = true; this.c(); },
        e: function() { this.streamEnded = true; this.c(); },
        c: function() { if (this.hydrated && this.streamEnded) { delete window.$_TSR; } },
        p: function(fn) { fn(); },
        buffer: [],
        initialized: true,
        streamEnded: true,
        hydrated: false,
        router: {
          matches: [],
          manifest: ${manifestStr},
          dehydratedData: {},
          lastMatchId: ""
        }
      };
    </script>
  </head>
  <body>
    <script type="module" src="/assets/${mainJsFile}"></script>
  </body>
</html>
`;
        fs.writeFileSync(path.join(publicDir, "index.html"), htmlContent, "utf-8");
        console.log(`\n[SPA Plugin] ✅ Generated ${path.join(publicDir, "index.html")} (CSS: ${cssFile}, JS: ${mainJsFile})\n`);
      }
    },
  };
}

export default defineConfig({
  plugins: [generateSpaIndexPlugin()],
  vite: {
    build: {
      outDir: "../backend/public",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
