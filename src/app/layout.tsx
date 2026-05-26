import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import CookieBanner from "@/components/ui/cookie-banner";
import { PlatformProvider } from "@/components/platform/platform-provider";
import { isIosUserAgent } from "@/lib/platform";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Genealogic — Genealogías caninas verificables",
    template: "%s · Genealogic",
  },
  description:
    "El registro público de genealogías caninas. Cada criador serio tiene su escaparate. Cada perro tiene su árbol genealógico verificable.",
  keywords: ["genealogía canina", "criadero", "perros", "camadas", "cachorros"],
  authors: [{ name: "Manuel Curtó SL" }],
  creator: "Genealogic",
  metadataBase: new URL("https://genealogic.io"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://genealogic.io",
    siteName: "Genealogic",
    title: "Genealogic — Genealogías caninas verificables",
    description:
      "El registro público de genealogías caninas. Cada criador serio tiene su escaparate.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Genealogic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Genealogic",
    description: "El registro público de genealogías caninas.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  // SOLO User-Agent. La cookie se descartó como fallback (ver platform.ts):
  // se quedaba pegada en navegadores móviles normales y los redirigía a /login.
  const isIos = isIosUserAgent(headerStore.get("user-agent"));
  return (
    <html
      lang="es"
      data-platform={isIos ? "ios" : "web"}
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-white text-ink">
        <PlatformProvider isIos={isIos}>
          {children}
          {!isIos && <CookieBanner />}
        </PlatformProvider>
      </body>
    </html>
  );
}
