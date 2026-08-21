import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Workbox is Google's Service Worker library
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Specifies file patterns to cache
        // ** means all directories, * means all files
        runtimeCaching: [
          {
            // API request caching
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            // Caches API requests matching this pattern
            
            handler: 'NetworkFirst',
            // Tries network first, falls back to cache if offline
            options: {
              cacheName: 'api-cache',
              // Name of the cache for API responses
              expiration: {
                maxEntries: 50,
                // Max number of entries in this cache
                maxAgeSeconds: 5 * 60, // 5 minutes
                // Max age of cached entries
              },
              cacheableResponse: {
                statuses: [0, 200]
                // Only cache responses with these status codes
              }
            }
          },
          {
            // MapTiler tiles caching: reduce flicker for map tiles
            urlPattern: /^https:\/\/(api\.maptiler\.com|[a-z0-9-]+\.tiles\.maptiler\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'maptiler-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Image caching
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            // Caches image files
            handler: 'CacheFirst',
            // Tries cache first, falls back to network if not cached
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg',],
      manifest: {
        name: 'Rovaniemi Pyöräillen',
        short_name: 'RoiReitti',
        description: 'Rovaniemen pyöräilyreitit kartalla',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/roireitti/',
})
