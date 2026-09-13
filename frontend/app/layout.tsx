import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HackShelf — Free Hacking Books, Read in Browser",
    template: "%s · HackShelf",
  },
  description:
    "A curated collection of 100% free, legally hosted hacking and cybersecurity books. Read in your browser, track your progress.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
