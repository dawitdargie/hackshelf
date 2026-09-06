/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Sample/placeholder covers now; real remote covers added when known.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
