import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { APP_NAME } from "@/lib/app";
import "./globals.css";

// Plex is a working typeface rather than a fashionable one: drawn for business
// software, its figures line up in a money column, and it holds at the 12–13px
// this app is read at all day.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME}: multi-company quotations, each printed on its own letterhead.`,
};

// Fonts, colours and nothing else. The sidebar and the page frame belong to the
// (app) group, because /login is the one screen that must render without them.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
