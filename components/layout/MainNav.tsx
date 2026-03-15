import { RESTAURANT_NAME } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Pickup" },
  { href: "/location", label: "Location & Hours" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function MainNav() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Image
            src="/images/logo/logo-pho-ginger.png"
            alt={`${RESTAURANT_NAME} logo`}
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
          <span className="sr-only">{RESTAURANT_NAME}</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-neutral-700 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

