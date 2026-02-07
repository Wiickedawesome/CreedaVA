import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not automatically inject `.env*` values into `process.env` inside config.
  // Use `loadEnv` so `VITE_BASE_PATH` from `.env.local` is honored for local builds/preview.
  const env = loadEnv(mode, process.cwd(), '')

  // Use repository name for GitHub Pages, root for Azure/custom domain
  // Default to root (/) for production unless explicitly set to /CreedaVA/ for GitHub Pages
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src')
      }
    },
    build: {
    // Optimize bundle - TEMPORARILY DISABLE MINIFICATION FOR PRODUCTION FIX
    target: 'esnext',
    minify: false, // Disabled to fix production error
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor'
          }
          
          // UI libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion'
          }
          
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'icons'
          }
          
          // Radix UI components (grouped together)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui'
          }
          
          // i18n
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next')) {
            return 'i18n'
          }
          
          // Admin-only dependencies
          if (id.includes('/admin/') || 
              id.includes('node_modules/@tanstack/react-table')) {
            return 'admin'
          }
          
          // Other large node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // Optimize asset file names for better caching
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]'
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 800, // Reduced to catch bloat earlier
    // Enable CSS code splitting
    cssCodeSplit: true,
    // No source maps for faster builds and smaller size
    sourcemap: false,
    // Preload optimization
    modulePreload: {
      polyfill: true
    },
    // Asset inlining threshold - increased for better caching
    assetsInlineLimit: 8192, // 8kb - inline smaller assets as base64
    // Generate manifest for better module resolution
    manifest: true
    },
    // Performance optimizations
    optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      '@radix-ui/react-slot',
      '@phosphor-icons/react',
      'date-fns'
    ],
    exclude: ['@azure/cosmos'], // Don't optimize backend dependency
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      }
    }
    },
    // Enhanced server configuration for development
    server: {
    hmr: {
      overlay: false, // Disable error overlay for better performance
      port: 24678 // Custom HMR port to avoid conflicts
    },
    // Proxy API requests to Azure Functions backend
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    // Enable compression for dev server
    middlewareMode: false,
    // Optimize file watching
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    }
    },
    // Enhanced preview configuration
    preview: {
    port: 4173,
    strictPort: true,
    cors: true
    },
    // Add experimental features for better performance
    experimental: {
    renderBuiltUrl(filename) {
      // Use CDN for assets in production if needed
      return `/${filename}`
    }
    }
  }
});
