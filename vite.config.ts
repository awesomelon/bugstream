import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    // Strip non-ASCII characters from bundled content scripts
    // Required because rrweb contains Chinese PostCSS deprecation warnings
    // that Chrome Manifest V3 content script loader rejects
    {
      name: 'strip-non-ascii',
      apply: 'build',
      generateBundle(_, bundle) {
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (fileName.endsWith('.js') && 'code' in chunk) {
            // Replace non-ASCII characters with empty string
            chunk.code = chunk.code.replace(/[^\x00-\x7F]/g, '');
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        networkInjected: 'src/content/injected/networkInjected.ts',
        consoleInjected: 'src/content/injected/consoleInjected.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'networkInjected') {
            return 'injected/networkInjected.js';
          }
          if (chunkInfo.name === 'consoleInjected') {
            return 'injected/consoleInjected.js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
