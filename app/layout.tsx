import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lato, Cinzel, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// Inter : substitut open-source de SF Pro, servi aux appareils non-Apple
// (Android/Windows) où SF Pro n'existe pas. Sur iPhone/Mac, la pile CSS
// utilise d'abord le vrai SF Pro.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-lato",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cinzel",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "EVERBLOOM — Catalogues Photo Numériques",
  description: "Créez votre catalogue photo PDF personnalisé. Partageable sur WhatsApp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${lato.variable} ${cinzel.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-[#E8E0D5] min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
