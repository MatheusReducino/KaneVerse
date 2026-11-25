import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
    '/openliga': {
        target: 'https://api.openligadb.de',
        changeOrigin: true,
        rewrite: (path)=>path.replace(/^\/openliga/, '')
    }
};

export default defineConfig({
    plugins: [react()],
    server: {port: 5173, strictPort: true, proxy},
    preview: {port: 5173, strictPort: true, proxy}
})
