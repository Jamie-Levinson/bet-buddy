import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { OddsFormatProviderWrapper } from "@/components/OddsFormatProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BetBuddy",
  description: "Track your bets and get insights on your betting history",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BetBuddy",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Classic Vegas deep navy background - like casino felt */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[oklch(0.11_0.04_260)] via-[oklch(0.10_0.03_265)] to-[oklch(0.12_0.04_255)]" />
        {/* Vegas gold accent gradients - visible through glass */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.70_0.12_85/0.15),transparent_70%)]" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_70%_80%,oklch(0.65_0.10_75/0.10),transparent_70%)]" />
        {/* Subtle royal blue accent */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,oklch(0.30_0.08_260/0.08),transparent_70%)]" />
        {/* Subtle texture for depth - like casino felt texture */}
        <div className="fixed inset-0 -z-10 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjQiIHJlc3VsdD0ibm9pc2UiLz48ZmVDb2xvck1hdHJpeCBpbj0ibm9pc2UiIHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')]" />
        
        <Nav />
        <OddsFormatProviderWrapper>
          <main className="relative">
            {children}
          </main>
        </OddsFormatProviderWrapper>
      </body>
    </html>
  );
}
