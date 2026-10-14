"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ITEMS = [
  { href: "/", label: "Dashboard", icon: icon("M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10") },
  { href: "/resources", label: "Resources", icon: icon("M4 7l8-4 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10") },
  { href: "/reservations", label: "Reservations", icon: icon("M4 6h16v14H4zM4 10h16M8 3v6M16 3v6") },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Main">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
