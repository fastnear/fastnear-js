import * as esbuild from "esbuild";

// Build ESM
await esbuild.build({
  entryPoints: ["src/index.esm.js"],
  format: "esm",
  outfile: "dist/fastnear.ejs",
  minify: true,
  bundle: true,
  platform: "browser",
});

await esbuild.build({
  entryPoints: ["src/index.js"],
  outfile: "dist/fastnear.js",
  minify: true,
  bundle: true,
  platform: "browser",
});

// Build CJS
await esbuild.build({
  entryPoints: ["src/index.js"],
  format: "cjs",
  outfile: "dist/fastnear.cjs",
  minify: true,
  bundle: true,
  platform: "browser",
});
