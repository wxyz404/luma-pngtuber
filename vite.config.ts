import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({plugins:[react()],resolve:{preserveSymlinks:true},base:'/',worker:{format:'es'},build:{rollupOptions:{input:{studio:resolve('index.html'),overlay:resolve('overlay.html')}}}});
