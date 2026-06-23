import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'BuddyRead',
        short_name: 'BuddyRead',
        description: 'Read the same book as a friend, across the distance.',
        theme_color: '#1c1813',
        background_color: '#1c1813',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache book-cover images (Google Books + Open Library) for offline viewing.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('books.google') ||
              url.hostname.includes('googleusercontent') ||
              url.hostname.includes('openlibrary.org') ||
              url.hostname.includes('covers.openlibrary.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'book-covers',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
