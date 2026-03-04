import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_SHEETS_API_URL;

  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            '/api': {
              target,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api/, '')
            }
          }
        }
      : undefined
  };
});
