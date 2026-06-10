import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com'
      }
    ]
  },
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
};

export default nextConfig;
