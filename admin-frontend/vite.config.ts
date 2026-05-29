import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/routes': path.resolve(__dirname, './src/routes'),
      '@/providers': path.resolve(__dirname, './src/providers'),
    },
  },
server: {
    port: 3002,
    host: '0.0.0.0',
    strictPort: true, 
    allowedHosts: [
      "ndulo.store",
      "ndulo.store"
    ]
  },
  
  preview: {
    port: 3002,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      "ndulo.store",
      "ndulo.store"
    ]
  },
})