import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['pdfjs-dist']
    },
    server: {
        port: 5173,
        host: true, // Enable listening on all addresses (for mobile access)
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
})
