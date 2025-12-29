
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 确保构建时将代码中的 process.env.API_KEY 替换为 Vercel 环境变量中的实际值
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000
  }
});
