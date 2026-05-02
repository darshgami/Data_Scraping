import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split xlsx into its own chunk as it is large
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            // Other vendors
            return 'vendor';
          }
        }
      }
    }
  }
})
