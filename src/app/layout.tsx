import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/ui/cookie-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Genealogic — Plataforma de Crianza Canina",
    template: "%s — Genealogic",
  },
  description: "La plataforma definitiva para criadores y propietarios de perros. Gestiona genealogías, camadas, criaderos, CRM y mucho más.",
  keywords: ["crianza canina", "pedigree", "genealogía", "criadero", "perros", "camadas", "cachorros", "CRM criadores", "gestión canina"],
  authors: [{ name: "Manuel Curtó SL" }],
  creator: "Genealogic",
  metadataBase: new URL("https://genealogic.io"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://genealogic.io",
    siteName: "Genealogic",
    title: "Genealogic — Plataforma de Crianza Canina",
    description: "La plataforma definitiva para criadores y propietarios de perros. Gestiona genealogías, camadas, criaderos, CRM y mucho más.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Genealogic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Genealogic — Plataforma de Crianza Canina",
    description: "La plataforma definitiva para criadores y propietarios de perros.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })();
        `}} />
      </head>
      <body className="font-sans min-h-full flex flex-col">{children}<CookieBanner /></body>
    </html>
  );
}
