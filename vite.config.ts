import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH lets the same build work on GitHub Pages (/repo-name/) and on
// root-hosted services such as Netlify, Vercel or Cloudflare Pages (/).
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    // the 3D bundle (three.js + r3f) is loaded lazily behind the preloader
    chunkSizeWarningLimit: 1600,
  },
})
