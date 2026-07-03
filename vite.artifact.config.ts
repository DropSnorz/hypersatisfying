import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Standalone single-file build for sharing the game as one static
 * HTML artifact (no server, no separate chunk files). Not used for
 * normal development — see vite.config.ts.
 */
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
