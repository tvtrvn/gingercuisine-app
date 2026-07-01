import { FeaturedSection } from "@/components/home/FeaturedSection";
import { Hero } from "@/components/home/Hero";
import { getMenuItems } from "@/lib/menuStore";
import { RESTAURANT_ADDRESS, RESTAURANT_HOURS } from "@/lib/config";
import Link from "next/link";

// Read the merged menu per request so owner overrides/sold-out flags show
// immediately. Without this, Next prerenders the featured list at build time
// (the DB read isn't a `fetch`, so it isn't auto-detected as dynamic).
export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getMenuItems();
  const featuredItems = items.filter((item) => item.isFeatured).slice(0, 6);

  return (
    <div className="space-y-16 md:space-y-24">
      <Hero />

      <FeaturedSection items={featuredItems} />

      {/* Testimonials */}
      <section
        aria-labelledby="testimonials-heading"
        className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <h2
          id="testimonials-heading"
          className="text-xl font-semibold tracking-tight text-neutral-900"
        >
          Guests are saying
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <figure className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-5">
            <blockquote className="text-sm leading-relaxed text-neutral-700">
              “Best pho in the neighborhood. Broth is rich without being heavy.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-500">
              — Happy regular
            </figcaption>
          </figure>
          <figure className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-5">
            <blockquote className="text-sm leading-relaxed text-neutral-700">
              “Super easy to order pickup on my way home from work.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-500">
              — Weeknight diner
            </figcaption>
          </figure>
          <figure className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-5">
            <blockquote className="text-sm leading-relaxed text-neutral-700">
              “Fresh herbs, crispy baguettes, and very friendly family service.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-500">
              — Bánh mì fan
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Find us strip */}
      <section
        aria-labelledby="find-us-heading"
        className="grid gap-8 overflow-hidden rounded-2xl bg-neutral-900 px-6 py-10 text-neutral-100 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center"
      >
        <div className="space-y-4">
          <h2
            id="find-us-heading"
            className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            Find us
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-neutral-300">
            {RESTAURANT_ADDRESS}
          </p>
          <p className="text-sm text-neutral-300">
            Hours:{" "}
            <span className="font-semibold text-white">{RESTAURANT_HOURS}</span>
          </p>
          <Link
            href="/location"
            className="inline-flex text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
          >
            View full map &amp; hours →
          </Link>
        </div>
        <div className="h-48 overflow-hidden rounded-xl border border-white/10 bg-neutral-800 shadow-lg sm:h-56 lg:h-full lg:min-h-[14rem]">
          <iframe
            title="Map to restaurant"
            aria-label="Map showing restaurant location"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.172402872174!2d-79.38362402376649!3d43.66538415164262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34b3284c5cf1%3A0x514b5f0ea077388a!2sPho%20Ginger!5e0!3m2!1sen!2sca!4v1772558773033!5m2!1sen!2sca"
          />
        </div>
      </section>
    </div>
  );
}
