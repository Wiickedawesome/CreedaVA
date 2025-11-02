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
  // Use relative paths so the app works on subpaths (e.g., GitHub Pages /CreedaVA/)
  base: './',
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
