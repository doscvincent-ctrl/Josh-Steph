import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Josh-Steph/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 4173),
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 4173),
    strictPort: false,
  },
})
