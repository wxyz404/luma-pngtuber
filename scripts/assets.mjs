import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root='public';await fs.mkdir(`${root}/sample`,{recursive:true});await fs.mkdir(`${root}/models/wasm`,{recursive:true});
const { art } = await import('./sample-art.mjs');
for(const [name,content] of Object.entries(art))await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${content}</svg>`)).png().toFile(`${root}/sample/${name}.png`);
for(const name of await fs.readdir('node_modules/@mediapipe/tasks-vision/wasm'))if(/\.(wasm|js)$/.test(name))await fs.copyFile(path.join('node_modules/@mediapipe/tasks-vision/wasm',name),`${root}/models/wasm/${name}`);
const dest=`${root}/models/face_landmarker.task`;try{await fs.access(dest);}catch{const url='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';const r=await fetch(url);if(!r.ok)throw new Error(`Model download failed: ${r.status}`);await fs.writeFile(dest,Buffer.from(await r.arrayBuffer()));}
console.log('Sample PNGs, WASM runtime, and face model are bundled.');
