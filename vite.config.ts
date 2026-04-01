import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Entrega Facilitada - Gestão de Vistorias',
        short_name: 'Entrega Facilitada',
        description: 'Plataforma profissional para gestão de vistorias imobiliárias.',
        theme_color: '#10b981', // Emerald 500
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/og-image.png',
            sizes: '1200x630',
            type: 'image/png'
          },
          {
            src: '/favicon.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
