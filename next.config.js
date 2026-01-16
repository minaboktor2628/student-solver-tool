/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    typedRoutes: true,
  }, // swcMinify: true, // minification using SWC, performance optimization
  reactStrictMode: true, // helps catch potential problems
  output: "standalone", // standalone server output for docker, generates .next/standalone without source code and node_modules
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default config;
