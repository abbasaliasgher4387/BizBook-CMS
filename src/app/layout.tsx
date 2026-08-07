import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import SideNav from "@/components/side-nav";
import { APP_NAME, APP_TAGLINE } from "@/lib/app";
import "./globals.css";

// Plex is a working typeface rather than a fashionable one: drawn for business
// software, its figures line up in a money column, and it holds at the 12–13px
// this app is read at all day.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: `${APP_NAME}: multi-company quotations, each printed on its own letterhead.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* The sidebar is .no-print, so Ctrl+P on a quotation yields the sheet
            alone — which is why the offset below is reset for print too. */}
        <SideNav />
        <div className="app-shell lg:pl-56">
          <main className="app-main mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-5 sm:py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
