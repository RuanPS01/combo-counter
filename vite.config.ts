import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// O GitHub Pages serve o projeto em https://<user>.github.io/<repo>/, entao o
// build precisa de um base path. Em dev servimos na raiz.
const repoBase = process.env.VITE_BASE ?? '/combo-counter/'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // `vite preview` serve o bundle ja construido, entao precisa do mesmo base.
  base: command === 'build' || isPreview ? repoBase : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Combo Counter',
        short_name: 'Combo',
        description: 'Contador de combos neon, offline-first, protegido por chave de acesso.',
        theme_color: '#05060f',
        background_color: '#05060f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        lang: 'pt-BR',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // O SDK do Firebase e carregado sob demanda: fica fora do precache
        // (nao faz sentido baixar ~500 kB em modo local) e entra no cache na
        // primeira vez que for realmente usado.
        globIgnores: ['**/firebase-*.js'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/firebase-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-sdk',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: 'firebase', test: /node_modules[\\/]@?firebase/ }],
        },
      },
    },
  },
}))
