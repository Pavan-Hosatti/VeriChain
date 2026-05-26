import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            include: ['buffer', 'process', 'util', 'stream', 'crypto', 'vm'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    resolve: {
        alias: {
            // Ensure Buffer and process are available
            'buffer': 'buffer',
            'process': 'process/browser',
            'stream': 'stream-browserify',
            'crypto': 'crypto-browserify',
        },
    },
    define: {
        'global': 'globalThis',
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4001',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
    },
});
