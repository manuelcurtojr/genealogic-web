import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import CookieBanner from "@/components/ui/cookie-banner";
import { PlatformProvider } from "@/components/platform/platform-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { isIosUserAgent } from "@/lib/platform";
import { getLocale } from "@/lib/locale";
import { getTranslator } from "@/lib/i18n";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslator(await getLocale());
  return {
    title: {
      default: t("Genealogic — Genealogías caninas verificables"),
      template: "%s · Genealogic",
    },
    description: t(
      "El registro público de genealogías caninas. Cada criador serio tiene su escaparate. Cada perro tiene su árbol genealógico verificable."
    ),
    keywords: [
      t("genealogía canina"),
      t("criadero"),
      t("perros"),
      t("camadas"),
      t("cachorros"),
    ],
    authors: [{ name: "Manuel Curtó SL" }],
    creator: "Genealogic",
    metadataBase: new URL("https://www.genealogic.io"),
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: "https://www.genealogic.io",
      siteName: "Genealogic",
      title: t("Genealogic — Genealogías caninas verificables"),
      description: t(
        "El registro público de genealogías caninas. Cada criador serio tiene su escaparate."
      ),
      // og:image se genera automáticamente desde src/app/opengraph-image.tsx.
      // Next.js inyecta el meta tag <og:image> apuntando a /opengraph-image
      // sin que tengamos que listarlo aquí.
    },
    twitter: {
      card: "summary_large_image",
      title: "Genealogic",
      description: t("El registro público de genealogías caninas."),
      // Igual que con openGraph: la twitter:image se hereda del opengraph-image.tsx
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  // SOLO User-Agent. La cookie se descartó como fallback (ver platform.ts):
  // se quedaba pegada en navegadores móviles normales y los redirigía a /login.
  const isIos = isIosUserAgent(headerStore.get("user-agent"));
  // Locale resuelto server-side (cookie → Accept-Language → es) para el
  // atributo lang del <html> (SEO + accesibilidad).
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      data-platform={isIos ? "ios" : "web"}
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-white text-ink">
        <LocaleProvider locale={locale}>
          <PlatformProvider isIos={isIos}>
            {children}
            {!isIos && <CookieBanner />}
          </PlatformProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
