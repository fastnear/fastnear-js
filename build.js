import * as esbuild from 'esbuild';

// Build ESM
await esbuild.build({
  entryPoints: ['src/index.js'],
  format: 'esm',
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'browser'
});

// Build CJS
await esbuild.build({
  entryPoints: ['src/index.js'],
  format: 'cjs',
  outfile: 'dist/index.cjs',
  bundle: true,
  platform: 'browser'
});