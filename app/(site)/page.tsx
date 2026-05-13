import { PaperMenuModal } from "@/components/ui/PaperMenuModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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
    <div className="space-y-16 md:space-y-20">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="order-2 space-y-8 lg:order-1">
          <Badge tone="brand" dot className="uppercase tracking-wider">
            Modern Vietnamese Kitchen
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl md:leading-[1.05]">
            {RESTAURANT_NAME}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Warm, brothy bowls of pho, crisp bánh mì, and fresh vermicelli
            bowls—made from family recipes, ready for easy pickup.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" pill className="min-w-[10rem]">
              <Link href="/order">Order Pickup</Link>
            </Button>
            <Button asChild variant="outline" size="lg" pill>
              <Link href="/menu">View Full Menu</Link>
            </Button>
            <PaperMenuModal />
          </div>
        </div>
        <div className="order-1 relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-neutral-200/80 shadow-[var(--shadow-card)] sm:aspect-[2/1] lg:order-2 lg:aspect-auto lg:h-[22rem]">
          <Image
            src="/images/Ginger-Food-Photos/general food image.webp"
            alt="Ginger Cuisine restaurant food"
            fill
            className="object-cover"
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pb-5 pt-24">
            <p className="max-w-md text-sm font-medium leading-relaxed text-white/95 sm:text-base">
              &ldquo;Comforting pho and crispy bánh mì that taste like
              home.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Featured items */}
      <section aria-labelledby="featured-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="featured-heading"
              className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl"
            >
              Featured dishes
            </h2>
            <p className="mt-1 max-w-lg text-sm text-neutral-600">
              Customer favorites — order for pickup in a few taps.
            </p>
          </div>
          <Link
            href="/menu"
            className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            See all menu →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item, i) => (
            <Card
              key={item.id}
              interactive
              className="group overflow-hidden border-amber-100/60"
            >
              <CardBody className="flex flex-col p-0">
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-50 via-amber-50 to-rose-50">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      priority={i < 3}
                    />
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {item.name}
                  </h3>
                  {item.vietnameseName && (
                    <p className="text-xs font-medium text-brand-800">
                      {item.vietnameseName}
                    </p>
                  )}
                  <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                  <p className="pt-1 text-sm font-semibold text-neutral-900">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

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
