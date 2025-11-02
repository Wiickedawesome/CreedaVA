import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Try to import Spark plugins, but make them optional
let sparkPlugin: any = null;
let createIconImportProxy: any = null;

try {
  sparkPlugin = (await import("@github/spark/spark-vite-plugin")).default;
  createIconImportProxy = (await import("@github/spark/vitePhosphorIconProxyPlugin")).default;
} catch (e) {
  console.warn('Spark plugins not available, running without them');
}

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths so the app works on subpaths (e.g., GitHub Pages /CreedaVA/)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Add Spark plugins only if available
    ...(createIconImportProxy ? [createIconImportProxy() as PluginOption] : []),
    ...(sparkPlugin ? [sparkPlugin() as PluginOption] : []),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
