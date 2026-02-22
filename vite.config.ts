import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /<repo-name>/
  base: command === 'build' ? '/hull-fouling/' : '/',
  plugins: [react(), tailwindcss()],
}))
