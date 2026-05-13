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
    host: '0.0.0.0',
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        // target: 'http://192.168.200.40:18080',
        target: 'http://localhost:18080',
        changeOrigin: true,
        
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: [
            'echarts/core',
            'echarts/charts',
            'echarts/components',
            'echarts/renderers',
          ],
          vue: ['vue', 'vue-router', 'pinia'],
          utils: ['axios', 'dayjs', 'lodash-es', '@vueuse/core'],
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
})
