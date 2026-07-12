import { Card, CardBody } from "@/components/ui/Card";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionProvider, Reveal } from "./motion-primitives";

/** Homepage "Featured dishes" — cards stagger in as they scroll into view. */
export function FeaturedSection({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="featured-heading"
            className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl"
          >
            Featured dishes
          </h2>
          <p className="mt-2 max-w-lg text-sm text-neutral-600">
            Customer favorites — order for pickup in a few taps.
          </p>
        </div>
        <Link
          href="/menu"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          See all menu
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <MotionProvider>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.06}>
              <Card
                interactive
                className="group h-full overflow-hidden border-amber-100/60 transition-shadow duration-200"
              >
                <CardBody className="flex h-full flex-col p-0">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-50 via-amber-50 to-rose-50">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        priority={i < 3}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {item.name}
                    </h3>
                    {item.vietnameseName && (
                      <p className="text-xs font-medium text-brand-800">
                        {item.vietnameseName}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {item.description}
                    </p>
                    <p className="mt-auto pt-2 text-base font-semibold text-neutral-900">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </MotionProvider>
    </section>
  );
}
