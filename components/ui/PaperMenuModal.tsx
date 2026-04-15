"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// Add, remove, or reorder pages here. They stack top-to-bottom.
const PAPER_MENU_PAGES = [
  { src: "/images/Menu.jpg", alt: "Ginger Cuisine paper menu – page 1" },
  { src: "/images/Menu 2.jpg", alt: "Ginger Cuisine paper menu – page 2" },
];

export function PaperMenuModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        View Paper Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-neutral-900">
                Paper Menu
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-0 p-2">
              {PAPER_MENU_PAGES.map((page) => (
                <Image
                  key={page.src}
                  src={page.src}
                  alt={page.alt}
                  width={800}
                  height={1100}
                  className="w-full"
                  priority
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
