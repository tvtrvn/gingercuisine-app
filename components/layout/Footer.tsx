import {
    RESTAURANT_ADDRESS,
    RESTAURANT_NAME,
    RESTAURANT_PHONE,
} from "@/lib/config";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-medium text-neutral-800">{RESTAURANT_NAME}</p>
          <p>{RESTAURANT_ADDRESS}</p>
          <a href={`tel:${RESTAURANT_PHONE}`} className="hover:underline">
            {RESTAURANT_PHONE}
          </a>
        </div>
        <div className="flex gap-4">
          <Link href="/location" className="hover:underline">
            Location &amp; Hours
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} {RESTAURANT_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

