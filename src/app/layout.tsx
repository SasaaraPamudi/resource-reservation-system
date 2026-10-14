import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Reservation System",
  description: "Manage shared resources and reservations in one place",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="inner">
            <Link href="/" className="brand">Resource Reservations</Link>
            <nav>
              <Link href="/">Dashboard</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/reservations">Reservations</Link>
            </nav>
            <Link href="/reservations/new" className="btn primary small">+ New reservation</Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
