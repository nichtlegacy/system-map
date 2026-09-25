import type { NextConfig } from "next";

/**
 * Two builds from one config. The default is the standalone server the
 * Dockerfile runs. `STATIC_EXPORT=1` writes plain files instead, which is how
 * scripts/build-site.sh puts the live demo on GitHub Pages under a sub-path.
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: staticExport ? "export" : "standalone",
  basePath,
  // Pages serves `/demo/example/index.html` for `/demo/example/`, not for
  // `/demo/example`.
  trailingSlash: staticExport,
  // No next/image anywhere, so the optimiser never runs. Leaving sharp out of
  // the traced server keeps the build output plain JavaScript, which is what
  // lets the Dockerfile build once and ship to amd64 and arm64 alike.
  images: { unoptimized: true },
  outputFileTracingExcludes: { "*": ["node_modules/sharp/**", "node_modules/@img/**"] },
  // `next dev` would otherwise write AGENTS.md and CLAUDE.md into the repo.
  agentRules: false,
};

export default nextConfig;
