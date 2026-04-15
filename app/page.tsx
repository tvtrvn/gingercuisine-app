import { PaperMenuModal } from "@/components/ui/PaperMenuModal";
import { menuItems } from "@/data/menu";
import {
  RESTAURANT_ADDRESS,
  RESTAURANT_HOURS,
  RESTAURANT_NAME,
} from "@/lib/config";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const featuredItems = menuItems.filter((item) => item.isFeatured).slice(0, 6);

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[3fr,2fr] md:items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">
            Modern Vietnamese Kitchen
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            {RESTAURANT_NAME}
          </h1>
          <p className="max-w-xl text-base text-neutral-700 md:text-lg">
            Warm, brothy bowls of pho, crisp bánh mì, and fresh vermicelli
            bowls—made from family recipes, ready for easy pickup.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/order"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Order Pickup
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
            >
              View Full Menu
            </Link>
            <PaperMenuModal />
          </div>
        </div>
        <div className="relative hidden h-64 overflow-hidden rounded-3xl shadow-sm md:block">
          <Image
            src="/images/Ginger-Food-Photos/general food image.webp"
            alt="Ginger Cuisine restaurant food"
            fill
            className="object-cover"
            priority
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-20 sm:px-5 sm:pb-5">
            <p className="max-w-sm text-sm font-semibold leading-snug text-white drop-shadow-sm sm:text-base">
              &ldquo;Comforting pho and crispy bánh mì that taste like home.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Featured items */}
      <section aria-labelledby="featured-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="featured-heading"
            className="text-lg font-semibold tracking-tight text-neutral-900"
          >
            Featured dishes
          </h2>
          <Link
            href="/menu"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            See all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
            >
              <div className="relative mb-3 h-28 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-emerald-50 to-rose-100">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                {item.name}
              </h3>
              {item.vietnameseName && (
                <p className="text-xs text-emerald-700">
                  {item.vietnameseName}
                </p>
              )}
              <p className="mt-2 line-clamp-3 text-xs text-neutral-600">
                {item.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                {formatCurrency(item.price)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        aria-labelledby="testimonials-heading"
        className="space-y-4 rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="testimonials-heading"
            className="text-lg font-semibold tracking-tight text-neutral-900"
          >
            Guests are saying
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <figure className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <blockquote className="text-sm text-neutral-700">
              “Best pho in the neighborhood. Broth is rich without being heavy.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-600">
              — Happy regular
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <blockquote className="text-sm text-neutral-700">
              “Super easy to order pickup on my way home from work.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-600">
              — Weeknight diner
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <blockquote className="text-sm text-neutral-700">
              “Fresh herbs, crispy baguettes, and very friendly family service.”
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-neutral-600">
              — Bánh mì fan
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Find us strip */}
      <section
        aria-labelledby="find-us-heading"
        className="grid gap-6 rounded-3xl bg-emerald-950 px-5 py-6 text-emerald-50 sm:grid-cols-[3fr,2fr] sm:px-8"
      >
        <div className="space-y-2">
          <h2
            id="find-us-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Find us
          </h2>
          <p className="text-sm text-emerald-100">{RESTAURANT_ADDRESS}</p>
          <p className="text-sm text-emerald-100">
            Hours: <span className="font-medium">{RESTAURANT_HOURS}</span>
          </p>
          <Link
            href="/location"
            className="mt-2 inline-flex text-sm font-semibold text-amber-200 hover:text-amber-100"
          >
            View full map &amp; hours →
          </Link>
        </div>
        <div className="h-40 overflow-hidden rounded-2xl border border-emerald-700 bg-emerald-900">
          <iframe
            title="Map to restaurant"
            aria-label="Map showing restaurant location"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.172402872174!2d-79.38362402376649!3d43.66538415164262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34b3284c5cf1%3A0x514b5f0ea077388a!2sPho%20Ginger!5e0!3m2!1sen!2sca!4v1772558773033!5m2!1sen!2sca"
          ></iframe>
        </div>
      </section>
    </div>
  );
}

