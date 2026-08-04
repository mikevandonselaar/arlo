import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      // Include icon files in the precache manifest
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],

      manifest: {
        name: 'Arlo',
        short_name: 'Arlo',
        description: 'In-store shopping redefined by KODA',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      // Workbox config: precache all build assets + runtime cache for API
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache alleen data-verzoeken — inlog-verzoeken NOOIT cachen,
            // anders breekt Google-login met "bad_oauth_state"-fouten.
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase.co') && !url.pathname.startsWith('/auth/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      // Proxies /api/openai/... → https://api.openai.com/...
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/openai/, ''),
      },

      // Proxies /api/anthropic/... → https://api.anthropic.com/...
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/anthropic/, ''),
      },
    },
  },
})
