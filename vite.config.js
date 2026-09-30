import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    cors: {
      origin: 'https://www.owlbear.rodeo'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
