import { defineConfig } from 'vite';
import path from 'node:path';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        ssr: true,
        minify: true,
        sourcemap: true,
        outDir: './dist',
        emptyOutDir: true,
        lib: {
            entry: path.resolve(__dirname, 'index.ts'),
            formats: ['es'],
        },
        rollupOptions: {
            output: {
                format: 'es',
                preserveModules: true,
                preserveModulesRoot: '.',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
    },
});
