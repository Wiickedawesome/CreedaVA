import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Try to import Spark plugins, but make them optional
function getSparkPlugins(): PluginOption[] {
  try {
    // Using dynamic require to avoid top-level await issues
    const sparkPluginModule = require("@github/spark/spark-vite-plugin");
    const iconProxyModule = require("@github/spark/vitePhosphorIconProxyPlugin");
    return [
      iconProxyModule.default() as PluginOption,
      sparkPluginModule.default() as PluginOption,
    ];
  } catch (e) {
    console.warn('Spark plugins not available, running without them');
    return [];
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Use repository name for GitHub Pages, root for Azure/custom domain
  // Set VITE_BASE_PATH=/ for Azure deployment or use default for GitHub Pages
  base: process.env.VITE_BASE_PATH || '/CreedaVA/',
  plugins: [
    react(),
    tailwindcss(),
    // Add Spark plugins only if available
    ...getSparkPlugins(),
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
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // Increased compression passes
        dead_code: true,
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        safari10: true,
        toplevel: true
      },
      format: {
        comments: false // Remove all comments
      }
    },
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
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
    // Asset inlining threshold
    assetsInlineLimit: 4096 // 4kb - inline smaller assets as base64
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      '@radix-ui/react-slot'
    ],
    exclude: ['sharp'] // Don't optimize dev dependency
  },
  // Server configuration for development
  server: {
    hmr: {
      overlay: false // Disable error overlay for better performance
    }
  }
});
