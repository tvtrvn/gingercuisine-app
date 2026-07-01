import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PaperMenuModal } from "@/components/ui/PaperMenuModal";
import { RESTAURANT_NAME } from "@/lib/config";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionProvider, Rise } from "./motion-primitives";

/**
 * Bold storefront hero. Server-rendered — the `<h1>` and hero image ship in the
 * initial HTML for LCP/SEO; `motion` (via Rise) only nudges already-painted
 * elements on hydration (transform-only, so no opacity delay on LCP).
 */
export function Hero() {
  return (
    <section className="relative isolate">
      {/* Soft brand glow backdrop — decorative only. A broad green wash plus a
          warmer amber pool that sits behind the food image (right on desktop). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[34rem] w-[min(74rem,120%)] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/70 via-emerald-100/50 to-rose-100/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 -z-10 hidden h-72 w-72 rounded-full bg-amber-200/50 blur-3xl lg:block"
      />

      <MotionProvider>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          {/* Copy */}
          <div className="order-2 lg:order-1">
            <Rise>
              <Badge tone="brand" dot className="uppercase tracking-wider">
                Modern Vietnamese Kitchen
              </Badge>
            </Rise>

            <Rise delay={0.06}>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl md:leading-[1.02]">
                {RESTAURANT_NAME}
              </h1>
            </Rise>

            <Rise delay={0.12}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Warm, brothy bowls of phở, crisp bánh mì, and fresh vermicelli —
                made from family recipes and{" "}
                <span className="relative whitespace-nowrap font-semibold text-brand-800">
                  <span className="absolute inset-x-0 bottom-1 -z-10 h-3 -rotate-1 rounded bg-amber-200/70" />
                  ready for easy pickup
                </span>
                .
              </p>
            </Rise>

            <Rise delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" pill className="min-w-[10rem]">
                  <Link href="/order">Order Pickup</Link>
                </Button>
                <Button asChild variant="outline" size="lg" pill>
                  <Link href="/menu">View Full Menu</Link>
                </Button>
                <PaperMenuModal />
              </div>
            </Rise>

            <Rise delay={0.24}>
              <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-600">
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span>
                    <span className="font-semibold text-neutral-900">Neighborhood favorite</span>{" "}
                    for phở &amp; bánh mì
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" aria-hidden />
                  Ready in ~15 min
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" aria-hidden />
                  Pay in person at pickup
                </li>
              </ul>
            </Rise>
          </div>

          {/* Image (LCP) — painted immediately; only nudged by a transform. */}
          <Rise delay={0.1} className="order-1 lg:order-2">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-neutral-200/80 shadow-[var(--shadow-card-hover)] ring-1 ring-black/5 sm:aspect-[2/1] lg:aspect-[5/4]">
              <Image
                src="/images/Ginger-Food-Photos/general food image.webp"
                alt="Ginger Cuisine restaurant food"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-28">
                <p className="max-w-md text-sm font-medium leading-relaxed text-white/95 sm:text-base">
                  &ldquo;Comforting phở and crispy bánh mì that taste like
                  home.&rdquo;
                </p>
              </div>
            </div>
          </Rise>
        </div>
      </MotionProvider>
    </section>
  );
}
