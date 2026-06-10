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
  // Force le tracker Next.js à inclure le binaire Chromium de @sparticuz/chromium
  // dans le bundle serverless. Sans cela, Turbopack externalise le package mais
  // omet son dossier bin/ → "input directory ... does not exist" sur Vercel.
  outputFileTracingIncludes: {
    '/api/generate-pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
