import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const jspdfAliasPath = new URL('../node_modules/jspdf/dist/jspdf.es.min.js', import.meta.url).pathname

export default defineConfig({
  root: 'frontend',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
      'react-router-dom': 'react-router',
      'jspdf': jspdfAliasPath,
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // target: 'https://afrohr.in',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
