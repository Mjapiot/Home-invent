import type { Metadata, Viewport } from "next";
import "./globals.css";

// [points w, points h, ratio] — doit rester aligné avec scripts/generate-splash.mjs
const SPLASH_SIZES: [number, number, number][] = [
  [375, 667, 2],
  [414, 896, 2],
  [375, 812, 3],
  [390, 844, 3],
  [393, 852, 3],
  [402, 874, 3],
  [414, 896, 3],
  [428, 926, 3],
  [430, 932, 3],
  [440, 956, 3],
];

export const metadata: Metadata = {
  title: "Inventaire Maison",
  description: "L'inventaire de vos maisons, pièce par pièce",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inventaire",
    startupImage: SPLASH_SIZES.map(([w, h, r]) => ({
      url: `/splash/splash-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f5" },
    { media: "(prefers-color-scheme: dark)", color: "#141318" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
