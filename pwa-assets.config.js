import { defineConfig, minimal2023Preset, combinePresetAndAppleSplashScreens } from '@vite-pwa/assets-generator/config'

const dark = { background: '#111111' }

// Launch images for the iPhones that run iOS 17+; iOS reads them when the app is added to the home screen.
const devices = [
  'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro Max', 'iPhone 13 mini', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'iPhone 16e', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air', 'iPhone SE 4.7"',
]

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: combinePresetAndAppleSplashScreens(
    {
      ...minimal2023Preset,
      apple: { ...minimal2023Preset.apple, resizeOptions: dark },
      maskable: { ...minimal2023Preset.maskable, resizeOptions: dark },
    },
    { padding: 0.55, resizeOptions: dark, darkResizeOptions: dark, linkMediaOptions: { log: false, addMediaScreen: true, xhtml: false } },
    devices,
  ),
  images: ['public/icon.svg'],
})
