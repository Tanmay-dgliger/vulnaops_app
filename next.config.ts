import type { NextConfig } from "next";

// The CSV data files are imported as raw text via webpack's built-in
// asset/source module type (see types/csv.d.ts for the TS module
// declaration), so their content is compiled directly into the JS bundle
// instead of being read from disk with fs at runtime. That sidesteps
// Vercel's build-time file tracer entirely -- a prior approach relying on
// fs.readFileSync(path.join(process.cwd(), ...)) worked locally but silently
// produced a serverless bundle missing the data/ directory in production
// (process.cwd() isn't statically resolvable by the tracer), causing an
// ENOENT at runtime that only showed up once deployed.
const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.csv$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
