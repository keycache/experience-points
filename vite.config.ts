import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project-site base path: served from
  // https://keycache.github.io/experience-points/, not the domain
  // root, so every built asset URL must be prefixed accordingly.
  base: '/experience-points/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
  },
})
