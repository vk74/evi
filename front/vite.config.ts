/**
 * version: 1.0.0
 * purpose: Vite build configuration for evi frontend SPA.
 * file: FRONTEND file: vite.config.ts
 * logic: Configures Vue 3 + Vuetify plugins, path aliases, code splitting (manualChunks),
 *        dev server settings, and production build optimizations.
 *        Replaces previous vue.config.js (Vue CLI / webpack) configuration.
 *
 * Changes in v1.0.0:
 * - Initial Vite configuration migrated from Vue CLI webpack setup
 * - Code splitting: admin, vuetify, phosphor-icons, vendors chunks
 * - Dev server on port 8080 with HMR
 * - Production: no source maps, esbuild minification
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 8080,
    open: false,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Admin module chunk
          if (id.includes('/src/modules/admin/')) {
            return 'chunk-admin'
          }
          // Vuetify chunk
          if (id.includes('node_modules/vuetify')) {
            return 'chunk-vuetify'
          }
          // Phosphor Icons chunk
          if (id.includes('node_modules/@phosphor-icons/vue')) {
            return 'chunk-icons-phosphor'
          }
          // General vendor chunk
          if (id.includes('node_modules')) {
            return 'chunk-vendors'
          }
        },
      },
    },
  },

  css: {
    devSourcemap: false,
  },
})
