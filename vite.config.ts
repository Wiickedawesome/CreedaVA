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
});
