import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next blocks cross-origin dev resources (HMR/JS chunks) by default. Without
  // this, a client hydrates only if opened from exactly "localhost" — opening
  // by 127.0.0.1 or a LAN IP (phone/tablet) blocks every chunk request, so
  // React never hydrates and client-side effects (e.g. the login redirect in
  // AuthGuard) never run.
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '172.*.*.*', '10.*.*.*'],

  // Production is a static export served by server/server.js (a plain Express
  // static-file server) — no Next.js server, no SSR. `next build` always sets
  // NODE_ENV=production, so this only affects the production build; `next dev`
  // is unaffected.
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
