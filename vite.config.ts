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
    // Optimize bundle
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      // Use conservative terser options to avoid unsafe scope transformations
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Moderate compression passes
        dead_code: true
        // NOTE: avoid unsafe_arrows/unsafe_methods which can break scope
      },
      mangle: {
        safari10: true,
        toplevel: false // avoid toplevel mangling to prevent variable scope issues
      },
      format: {
        comments: false // Remove all comments
      }
    },
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'scheduler', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@phosphor-icons/react'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-accordion',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-slot'
          ]
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
    exclude: ['sharp'] // Don't optimize dev dependency
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
