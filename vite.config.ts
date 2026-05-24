import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      /*
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'HelixStudio AI',
          short_name: 'Helix',
          description: 'The Universal AI Development Studio for training, inference, and development.',
          theme_color: '#00FF9F',
          background_color: '#0A0A0A',
          display: 'standalone',
          icons: [
            {
              src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=192&h=192&fit=crop',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=512&h=512&fit=crop',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
      */
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/agi-os-state.json']
      },
    },
  };
});
