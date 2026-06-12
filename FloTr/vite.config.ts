import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/flotr/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'recharts'],
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
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Lets http://localhost:3000/swagger reach the API's Swagger UI in dev.
      // No rewrite: /swagger, /swagger/index.html and /swagger/v1/swagger.json pass through as-is.
      '/swagger': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
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
}))
