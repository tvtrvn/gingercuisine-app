"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
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
    <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/90 backdrop-blur-md">
      <div
        ref={navContainerRef}
        className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity duration-200 hover:opacity-90"
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
        <nav className="hidden gap-1 text-sm font-medium text-neutral-700 md:flex md:items-center">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 transition-colors duration-200",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-brand-800",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 transition-colors duration-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav-menu"
            className="absolute left-4 right-4 top-full z-50 mt-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg md:hidden"
          >
            <ul className="flex flex-col gap-0.5 text-sm font-medium">
              {navLinks.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname === link.href ||
                      pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 transition-colors duration-200",
                        active
                          ? "bg-brand-50 text-brand-900"
                          : "text-neutral-700 hover:bg-neutral-50 hover:text-brand-800",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
