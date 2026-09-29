import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const tunnelOrigin = process.env.ORIGIN ? new URL(process.env.ORIGIN) : null;
const tunnelHost = tunnelOrigin?.hostname;
const tunnelProtocol = tunnelOrigin?.protocol === 'https:' ? 'wss' : 'ws';
const tunnelClientPort = tunnelOrigin?.protocol === 'https:' ? 443 : tunnelOrigin ? 80 : undefined;

export default defineConfig({
  logLevel: 'info',
  build: {
    minify: true
  },
  server: process.env.NODE_ENV === 'development' ? {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    origin: process.env.ORIGIN || undefined,
    allowedHosts: ['app.localtunnel.it.com', 'client.localtunnel.it.com', 'frontend.localtunnel.it.com'],
    hmr: tunnelHost && tunnelClientPort
      ? {
        host: tunnelHost,
        protocol: tunnelProtocol,
        clientPort: tunnelClientPort
      }
      : undefined
  } : undefined,
  plugins: [
    tailwindcss(),
    sveltekit()
  ],
  ssr: {
    noExternal: ['svelte-motion']
  },
  optimizeDeps: {
    include: process.env.NODE_ENV === 'development' ? ['svelte', 'svelte/internal', '@sveltejs/kit'] : ['svelte', 'svelte/internal']
  }
});
