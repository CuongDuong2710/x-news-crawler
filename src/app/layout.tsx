import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X News Crawler | Command Center",
  description: "Real-time news intelligence dashboard with AI-powered analysis for X/Twitter data",
  keywords: ["news crawler", "twitter", "x", "sentiment analysis", "real-time", "dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        {/* Scanline effect overlay */}
        <div className="fixed inset-0 pointer-events-none z-50 scanline opacity-30" />

        {/* Grid pattern background */}
        <div className="fixed inset-0 pointer-events-none grid-pattern opacity-50" />

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
