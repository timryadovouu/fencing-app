import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const background = '#111417' // фон логотипа «Протокол»

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // В логотипе уже есть поля; у maskable оставляем запас под круглую обрезку Android.
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ['public/logo.svg'],
})
