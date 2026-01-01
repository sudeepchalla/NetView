import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // 1. Prevent vite from obscuring rust errors
  clearScreen: false,

  // 2. Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 3000,       // <--- Changed to 3000 to match your Tauri config
    strictPort: true, // <--- Tauri breaks if Vite switches ports automatically
    host: true,       // <--- Critical: exposes server to the internal network
    watch: {
      // 3. Tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})