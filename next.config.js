/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const config = {
  typedRoutes: true,
  // swcMinify: true, // minification using SWC, performance optimization
  reactStrictMode: true, // helps catch potential problems
  output: "standalone", // standalone server output for docker, generates .next/standalone without source code and node_modules
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

const withMDX = createMDX({
  configPath: "source.config.ts",
});

export default withMDX(config);
