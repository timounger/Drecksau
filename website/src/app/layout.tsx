/**
 * Root layout - fonts, metadata and the page shell.
 *
 * @module
 * @remarks
 * Three things live here that live nowhere else: the script that decides the
 * theme before the first paint, the one that decides the shape of the start
 * page, and the switch that changes the theme. All of them are here because
 * "every page" is a promise that only the shell can keep.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactElement } from "react";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { InlineScript } from "@/components/inline-script";
import { THEME_BOOT_SCRIPT } from "@/lib/theme/theme-boot";
import { LOOK_BOOT_SCRIPT } from "@/lib/look/look-boot";

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
    // No `data-theme` here on purpose. The exported HTML carries no choice, so
    // the stylesheet's media query governs until the script below writes one -
    // which is also what a reader without JavaScript is left with, and it is
    // the right answer for them. `suppressHydrationWarning` is what lets the
    // script touch this element before React arrives.
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Runs while the browser is still parsing the head, so the page is
            painted in the chosen colours once rather than in the wrong ones
            first. See lib/theme/theme-boot.ts. */}
        <InlineScript html={THEME_BOOT_SCRIPT} />
        {/* And the same for the shape of the start page, for the same reason:
            a layout corrected after hydration is a page that rearranges itself
            while one is looking at it. See lib/look/look-boot.ts. */}
        <InlineScript html={LOOK_BOOT_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
