import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            include: ['buffer', 'process', 'util', 'stream', 'crypto'],
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
    },
    build: {
        outDir: 'dist',
    },
});
