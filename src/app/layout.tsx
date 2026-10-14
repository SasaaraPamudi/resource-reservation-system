import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { APP_TIMEZONE } from "@/lib/format";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Resource Reservations",
  description: "See what is free, book it, and keep shared resources organised",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="Resource Reservations home">
              <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="var(--brand)" />
                <rect x="6" y="9" width="12" height="4" rx="2" fill="#fff" />
                <rect x="12" y="14" width="14" height="4" rx="2" fill="#fff" opacity=".8" />
                <rect x="8" y="19" width="9" height="4" rx="2" fill="#fff" opacity=".6" />
              </svg>
              <span>Reservations</span>
            </Link>
            <Link href="/reservations/new" className="btn primary side-cta">New reservation</Link>
            <NavLinks />
            <p className="side-foot">Times shown in {APP_TIMEZONE.replace("_", " ")}</p>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
