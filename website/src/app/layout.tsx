/**
 * Root layout - fonts, metadata and the page shell.
 *
 * @module
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactElement } from "react";
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
  title: {
    default: "Spielesammlung",
    template: "%s - Spielesammlung",
  },
  description: "Eine kleine Sammlung von Spielen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
