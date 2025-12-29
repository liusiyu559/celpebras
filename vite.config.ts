
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite 会在构建时将代码中的 process.env.API_KEY 替换为实际的字符串值
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000
  }
});
