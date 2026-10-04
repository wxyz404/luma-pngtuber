import { build } from 'esbuild';
await build({entryPoints:['electron/main.ts'],preserveSymlinks:true,bundle:true,platform:'node',format:'cjs',outfile:'dist-electron/main.cjs',external:['electron'],sourcemap:true});
await build({entryPoints:['electron/preload.ts'],preserveSymlinks:true,bundle:true,platform:'node',format:'cjs',outfile:'dist-electron/preload.cjs',external:['electron']});
await build({entryPoints:['src/tracking/worker.ts'],preserveSymlinks:true,bundle:true,platform:'browser',format:'iife',outfile:'dist/models/tracker.js',target:'chrome120'});
