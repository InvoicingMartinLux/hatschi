import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allergy Radar",
  description: "Pollen forecast for your location — know before you go",
};

export const viewport: Viewport = {
  themeColor: "#f7f9f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <footer className="border-t border-[var(--hairline)] py-6">
          <p className="text-center text-xs text-[var(--ink-muted)]">
            © 2026 Martin Lux ·{" "}
            <Link
              href="/impressum"
              className="underline decoration-[var(--hairline)] underline-offset-2 transition-colors hover:text-[var(--ink-secondary)]"
            >
              Impressum
            </Link>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
