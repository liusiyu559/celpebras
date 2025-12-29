
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 确保即使 API_KEY 未设置，应用也不会因为 process.env 缺失而崩溃
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000
  }
});
