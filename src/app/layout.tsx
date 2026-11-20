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
  "Log pocket cash and bank balance after each play session. Local-first habit score, streak, and history. No game hooks. A NeonGulf utility — not affiliated with Rockstar.";

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
    title: "Shore Ledger",
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Shore Ledger",
    description,
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
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
