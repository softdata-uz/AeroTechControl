// Runs after `next build` (postbuild). next.config.ts sets output: "export"
// unconditionally, so `out/` always exists here — copy it into the sibling
// AeroTechControlBackend repo's public/, which that NestJS app serves
// directly (see its src/main.ts) alongside the API, same origin, no proxy.
import { cpSync, rmSync } from 'node:fs';

const dest = '../AeroTechControlBackend/public';
rmSync(dest, { recursive: true, force: true });
cpSync('out', dest, { recursive: true });
