import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://192.168.200.40:18080', // 指向你的 Spring Boot 服务地址
        changeOrigin: true,
        // 如果后端接口本身没有 /api 前缀，需要开启下面这行进行重写：
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  },
})
