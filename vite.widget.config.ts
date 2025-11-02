import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

export default defineConfig({
  build: {
    lib: {
      entry: resolve(projectRoot, 'src/embed.tsx'),
      name: 'CreedaVAWidget',
      formats: ['iife'],
      fileName: () => `creedava-widget.iife.js`,
    },
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  }
})
