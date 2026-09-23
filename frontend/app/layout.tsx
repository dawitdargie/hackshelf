import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";

// Fonts are self-hosted under app/fonts (SIL Open Font License 1.1 — see the
// OFL-*.txt files alongside them). Fetching them from the Google Fonts CDN at
// build time made production builds depend on outbound network access, which
// fails inside the Docker build; local files keep builds deterministic.
const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap",
});
const syne = localFont({
  src: "./fonts/syne-variable.woff2",
  weight: "400 800",
  variable: "--font-display",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-variable.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HackShelf | Hacking Books, Read in Browser",
    template: "%s · HackShelf",
  },
  description:
    "A curated collection of legally hosted hacking and cybersecurity books. Read in your browser, track your progress.",
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
          <main className="flex-1 pt-[68px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
