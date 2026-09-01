import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TS (no build step) — Next needs to
  // transpile them itself instead of treating them as pre-built node_modules.
  transpilePackages: ["@doctor-connect/theme", "@doctor-connect/types", "@doctor-connect/validation"],
};

export default nextConfig;
