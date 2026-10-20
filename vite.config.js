import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// base './' keeps the build portable: GitHub Pages under /<repo>/, any static host, or a local preview.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? JSON.parse(readFileSync('./package.json', 'utf8')).version) },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Sets: exercise tracker',
        short_name: 'Sets',
        description: 'Log training sets at the gym or at home. Offline, on your phone.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111111',
        theme_color: '#111111',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
        globIgnores: ['**/apple-splash-*.png'], // iOS reads launch images at install, not offline
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: { include: ['tests/unit/**/*.test.js'], environment: 'node' },
})
