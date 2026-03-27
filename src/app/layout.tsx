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
  title: "Mada Spot — Bons Plans à Madagascar",
  description: "Mada Spot est la plateforme n°1 pour découvrir et réserver les meilleurs hôtels, restaurants et attractions touristiques à Madagascar. Comparez les prix, lisez les avis et réservez en ligne.",
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
  },
  openGraph: {
    title: "Mada Spot — Bons Plans à Madagascar",
    description: "Découvrez les meilleurs restaurants, hôtels et attractions touristiques à Madagascar.",
    url: "https://madaspot.com",
    siteName: "Mada Spot",
    locale: "fr_MG",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mada Spot — Bons Plans à Madagascar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mada Spot — Bons Plans à Madagascar",
    description: "Découvrez les meilleurs restaurants, hôtels et attractions à Madagascar.",
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
  maximumScale: 5,
  userScalable: true,
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
                </ToastProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
