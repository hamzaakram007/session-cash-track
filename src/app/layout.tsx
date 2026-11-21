import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl = "https://cash.neongulf.com";
const title = "Shore Ledger — session cash & bank habit tracker";
const description =
  "Log pocket cash, bank balance, and “banked before risk” after each play session. Habit score, streak, and history on your device. Self-report only — no game API. A NeonGulf utility.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Shore Ledger",
  },
  description,
  applicationName: "Shore Ledger",
  authors: [{ name: "NeonGulf" }],
  creator: "NeonGulf",
  keywords: [
    "session cash tracker",
    "bank habit tracker",
    "gaming money habits",
    "bank before mission habit",
    "local-first PWA",
    "Shore Ledger",
    "NeonGulf",
  ],
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Shore Ledger",
    title: "Shore Ledger — session cash habits",
    description,
    locale: "en_US",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "Shore Ledger — session cash and bank habit tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shore Ledger — session cash habits",
    description,
    images: ["/og.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shore Ledger",
  },
  icons: {
    icon: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.svg" }],
  },
  category: "productivity",
};

export const viewport: Viewport = {
  themeColor: "#061018",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#log-session"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--mint)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#041018]"
        >
          Skip to log a session
        </a>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
