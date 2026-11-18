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

export const metadata: Metadata = {
  title: "Shore Ledger — session cash & bank habit tracker",
  description:
    "Mobile-friendly PWA to log in-game pocket and bank habits each session. Local-first; Pro stub for sync and export. Independent fan utility.",
  applicationName: "Shore Ledger",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shore Ledger",
  },
  icons: {
    icon: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.svg" }],
  },
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
