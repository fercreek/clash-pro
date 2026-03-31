import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Para PWA completa (service worker, precache) instala:
// npm install -D vite-plugin-pwa
// Luego descomenta el bloque VitePWA de abajo.

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: false, // usamos public/manifest.json
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    //   },
    // }),
  ],
})
