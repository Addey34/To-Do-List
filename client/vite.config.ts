import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL,
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
});
