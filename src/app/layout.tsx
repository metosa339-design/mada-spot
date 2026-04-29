import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LazyCustomCursor from "@/components/ui/LazyCustomCursor";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import CookieConsent from "@/components/CookieConsent";
import { ToastProvider } from "@/contexts/ToastContext";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import QueryProvider from "@/providers/QueryProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import HtmlLangUpdater from "@/components/HtmlLangUpdater";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ThemeLightPreview from "@/app/theme-light-preview";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://madaspot.com"),
  verification: {
    google: "fX6u4yzE8B2J5L_QKdCpVl415KHO7wagjDagaO63BHU",
  },
  title: "Mada Spot — Hôtels, Restaurants & Attractions à Madagascar",
  description: "Découvrez et réservez les meilleurs hôtels, restaurants et attractions touristiques de Madagascar. Comparez les prix, lisez les avis vérifiés et contactez les établissements directement.",
  keywords: ["Madagascar", "tourisme Madagascar", "bons plans Madagascar", "meilleur hôtel Madagascar", "restaurant Antananarivo", "hôtel Nosy Be", "attractions touristiques Madagascar", "parcs nationaux Madagascar", "Mada Spot", "voyage Madagascar", "guide touristique Madagascar", "réservation hôtel Madagascar", "où manger Madagascar", "Tsingy", "Isalo", "baobab Madagascar"],
  authors: [{ name: "Mada Spot" }],
  creator: "Mada Spot",
  publisher: "Mada Spot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      fr: "/",
      en: "/?lang=en",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Mada Spot — Hôtels, Restaurants & Attractions à Madagascar",
    description: "Découvrez et réservez les meilleurs hôtels, restaurants et attractions touristiques de Madagascar.",
    url: "https://madaspot.com",
    siteName: "Mada Spot",
    locale: "fr_MG",
    alternateLocale: ["en_US"],
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mada Spot — Hôtels, Restaurants & Attractions à Madagascar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mada Spot — Hôtels, Restaurants & Attractions à Madagascar",
    description: "Découvrez et réservez les meilleurs hôtels, restaurants et attractions touristiques de Madagascar.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <OrganizationJsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <LazyCustomCursor />
        <ServiceWorkerRegister />
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider>
              <HtmlLangUpdater />
              <CurrencyProvider>
                <ToastProvider>
                  {children}
                  <CookieConsent />
                  <ThemeLightPreview />
                </ToastProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
