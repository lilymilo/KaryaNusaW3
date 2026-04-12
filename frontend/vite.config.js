import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = env.VITE_API_PROXY || 'http://localhost:5002'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': apiProxy,
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Vite v8 (Rolldown): manualChunks harus berupa fungsi
          manualChunks(id) {
            if (id.includes('node_modules/ethers')) return 'vendor-ethers';
            if (id.includes('node_modules/@solana')) return 'vendor-solana';
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
          },
        },
      },
    },
  }
})
