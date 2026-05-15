import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/ui/cookie-banner";

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

// Theme bootstrap — Cal.com-inspired system is light-first.
// Respect an explicit 'dark' preference if the user set one.
const themeBootstrap = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-white text-ink">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
