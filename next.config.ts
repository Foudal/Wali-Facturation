import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il doit rester externe au bundle
  // serverless plutôt que d'être traité par le bundler Next.js.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
