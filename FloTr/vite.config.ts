import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // In production the app is served from a sub-path (IIS: https://<host>/flotr/).
  // Every absolute URL in the manifest and the service worker must respect it,
  // otherwise Chrome's installability checks fail (start_url out of SW scope, 404 icons).
  const base = mode === 'production' ? '/flotr/' : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true }),
      VitePWA({
        registerType: 'autoUpdate',
        // Do not register the SW in dev mode — it causes confusing caching during development.
        devOptions: { enabled: false },
        includeAssets: ['icon-512.svg', 'icon-maskable.svg', 'apple-touch-icon.png', 'icons/*.png'],
        manifest: {
          id: base,
          name: 'FloTr — Floorball Training',
          short_name: 'FloTr',
          description: 'Správa floorballových tréninků a klubů',
          lang: 'cs',
          theme_color: '#0284c7',
          background_color: '#f9fafb',
          display: 'standalone',
          scope: base,
          start_url: base,
          // Relative srcs resolve against the manifest URL, so they work under any base.
          // PNGs are required for iOS (apple-touch-icon) and safest for installability;
          // regenerate them from the SVG masters with `npm run icons`.
          icons: [
            { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/pwa-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            { src: 'icon-512.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/(flotr\/)?(api|hubs|hangfire|swagger)/],
          runtimeCaching: [
            {
              // HTML navigation: always try network first, fall back to cache.
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'pages', networkTimeoutSeconds: 5 },
            },
            {
              // JS / CSS / fonts / images: serve from cache, revalidate in background.
              urlPattern: /\.(js|css|woff2?|png|svg|ico)$/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'assets', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
            {
              // Stable GET API responses (seasons, teams, clubs…): stale-while-revalidate.
              // RegExp instead of a function: the pattern must also match `/flotr/api/…`
              // in production, and functions cannot close over `base` (they are
              // serialized into the generated service worker).
              urlPattern: /\/api\/(?!notifications|hubs)/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'api-stable', expiration: { maxAgeSeconds: 60 * 5 } },
            },
          ],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-ui': ['lucide-react'],
            'vendor-charts': ['recharts'],
            'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            'vendor-misc': ['axios', 'zustand', 'date-fns'],
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://localhost:5210',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true,
        },
        '/swagger': {
          target: 'https://localhost:5210',
          changeOrigin: true,
          secure: false,
        },
        '/hangfire': {
          target: 'https://localhost:5210',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
      exclude: ['node_modules', 'dist', 'e2e'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: [
          'src/store/**',
          'src/hooks/**',
          'src/utils/**',
          'src/features/auth/authSchemas.ts',
          'src/features/admin/userListUtils.ts',
        ],
      },
    },
  }
})
