import {
  RESTAURANT_ADDRESS,
  RESTAURANT_NAME,
  RESTAURANT_PHONE,
} from "@/lib/config";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      {/* Mobile bottom padding clears the fixed order-bar / cart-FAB band so
          the last footer rows stay readable at full scroll. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 pb-28 text-sm text-neutral-600 md:flex-row md:items-start md:justify-between md:px-6 md:py-10">
        <div className="space-y-2">
          <p className="text-base font-semibold text-neutral-900">
            {RESTAURANT_NAME}
          </p>
          <p className="max-w-xs leading-relaxed">{RESTAURANT_ADDRESS}</p>
          <a
            href={`tel:${RESTAURANT_PHONE}`}
            className="inline-flex font-medium text-brand-700 transition-colors hover:text-brand-800"
          >
            {RESTAURANT_PHONE}
          </a>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <Link
            href="/location"
            className="font-medium text-neutral-800 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
          >
            Location &amp; Hours
          </Link>
          <Link
            href="/contact"
            className="font-medium text-neutral-800 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
          >
            Contact
          </Link>
        </div>
        <p className="text-xs text-neutral-500 md:text-right">
          © {new Date().getFullYear()} {RESTAURANT_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
