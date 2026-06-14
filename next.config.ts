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
    '/api/generate-pdf': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      './lib/pdf/templates/v3/**/*',
    ],
    '/api/admin/instructions-pdf': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      './lib/pdf/templates/instructions/**/*',
    ],
  },
  // En-têtes de sécurité de base (pas de CSP : trop de risque de casser le
  // rendu — voir audit).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
