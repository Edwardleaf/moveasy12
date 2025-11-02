import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 提供Node.js模块的浏览器实现
      buffer: 'buffer/',
      process: 'process/browser',
    }
  },
  define: {
    // 确保全局变量在浏览器中可用
    'global': 'window',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js全局变量填充
      define: {
        global: 'globalThis'
      }
    }
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: ``
      }
    }
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  preview: {
    host: '0.0.0.0',  // 允许外网访问
    port: 4173,
    strictPort: true,  // 强制使用4173端口
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'app.themoveasy.com',
      'themoveasy.com',
      'www.themoveasy.com'
    ],
  },
  server: {
    host: '0.0.0.0',  // 允许外网访问
    port: 5173,
    strictPort: true,  // 强制使用5173端口
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '129.226.195.19',
      'www.mytestkimxyz.xyz',
      'mytestkimxyz.xyz',
      'themoveasy.com',
      'www.themoveasy.com',
      'app.themoveasy.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
