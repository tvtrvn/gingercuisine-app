"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Pickup" },
  { href: "/location", label: "Location & Hours" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

interface MainNavProps {
  restaurantName: string;
}

export function MainNav({ restaurantName }: MainNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!isMobileMenuOpen || !navContainerRef.current) return;
      if (!navContainerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div
        ref={navContainerRef}
        className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Image
            src="/images/logo/logo-pho-ginger.png"
            alt={`${restaurantName} logo`}
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
          <span className="sr-only">{restaurantName}</span>
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
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? "Close" : "Menu"}
        </button>
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav-menu"
            className="absolute left-0 right-0 top-full z-50 mt-1 rounded-b-xl border border-neutral-200 bg-white p-4 shadow-lg md:hidden"
          >
            <ul className="flex flex-col gap-3 text-sm font-medium text-neutral-700">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-emerald-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

