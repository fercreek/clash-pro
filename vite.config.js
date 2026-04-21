import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import seo from './seo.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escText(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clashSeoPlugin() {
  const base = seo.siteUrl.replace(/\/$/, '')
  const ogImage = `${base}${seo.ogImagePath.startsWith('/') ? '' : '/'}${seo.ogImagePath}`
  const robots = seo.indexable ? 'index, follow' : 'noindex, nofollow'

  return {
    name: 'clash-seo',
    transformIndexHtml(html) {
      const block = `
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${base}/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${base}/" />
    <meta property="og:site_name" content="ClashPro" />
    <meta property="og:title" content="${escAttr(seo.title)}" />
    <meta property="og:description" content="${escAttr(seo.description)}" />
    <meta property="og:image" content="${escAttr(ogImage)}" />
    <meta property="og:locale" content="${escAttr(seo.ogLocale)}" />
    <meta name="twitter:card" content="${escAttr(seo.twitterCard)}" />
    <meta name="twitter:title" content="${escAttr(seo.title)}" />
    <meta name="twitter:description" content="${escAttr(seo.description)}" />
    <meta name="twitter:image" content="${escAttr(ogImage)}" />
`
      let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escText(seo.title)}</title>`)
      out = out.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escAttr(seo.description)}" />`
      )
      out = out.replace('<meta name="theme-color"', `${block}    <meta name="theme-color"`)
      return out
    },
    writeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const body = seo.indexable
        ? ['User-agent: *', 'Allow: /', '']
        : ['User-agent: *', 'Disallow: /', '']
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'robots.txt'), body.join('\n'), 'utf8')
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    clashSeoPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'manifest.json',
      ],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wav,mp3}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
