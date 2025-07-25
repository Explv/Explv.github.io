import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Explv.github.io/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    open: true,
    port: 3000
  }
})