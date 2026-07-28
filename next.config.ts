import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas révéler la technologie du serveur (en-tête X-Powered-By)
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],
  // Force le tracker Next.js à inclure le binaire Chromium de @sparticuz/chromium
  // et les templates Handlebars dans le bundle serverless Vercel.
  outputFileTracingIncludes: {
    "/api/generate-pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./lib/pdf/templates/**/*",
    ],
    // L'aperçu utilise le même moteur de rendu Handlebars que le PDF :
    // sans cette ligne, les templates sont absents du bundle serverless
    // et l'aperçu échoue en production (alors qu'il marche en local).
    "/api/catalogues/[id]/preview": ["./lib/pdf/templates/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
