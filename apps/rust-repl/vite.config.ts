import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  define: {
    __FOUNDRY_BUILD_ID__: JSON.stringify(
      mode === 'production' ? Date.now().toString() : 'dev',
    ),
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))
