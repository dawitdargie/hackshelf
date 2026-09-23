/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for the production Docker image.
  output: "standalone",
  reactStrictMode: true,
  // gzip/brotli the HTML + RSC payloads; source maps stay out of production.
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;

