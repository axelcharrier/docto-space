import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone for the VPS deploy (see .github/workflows/deploy.yml).
  output: "standalone",
  experimental: {
    // Enables `forbidden()` / `unauthorized()` so role checks can return
    // real 403 / 401 responses instead of client-side redirects.
    authInterrupts: true,
  },
};

export default nextConfig;
