import Image from "next/image";
import { VideoEmbed } from "@/components/about/VideoEmbed";

// Edit this array to add, remove, or reorder gallery photos.
const galleryPhotos = [
  { src: "/images/environment-photos/interior seating.jpg", alt: "Interior seating at Ginger Cuisine" },
  { src: "/images/environment-photos/pride-parade.webp", alt: "Ginger Cuisine at the Pride parade" },
  { src: "/images/Ginger-Food-Photos/rare-beef-pho-far.jpg", alt: "Classic beef pho" },
  { src: "/images/Ginger-Food-Photos/far-beef-banhmi copy.jpg", alt: "Beef bánh mì" },
  { src: "/images/Ginger-Food-Photos/chicken-shrimp-padthai.jpg", alt: "Chicken & shrimp pad thai" },
  { src: "/images/environment-photos/general-food-pic.webp", alt: "Ginger Cuisine dishes" },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl md:leading-[1.05]">
          Welcome to Phở Ginger!
        </h1>
        <p className="text-lg leading-relaxed text-neutral-600">
          We started this business because we love Vietnamese food and we want to share it with you.
          Thank you for your continued support—we look forward to serving you for many more years to come! Visit any of our locations across downtown Toronto and enjoy a taste of home-cooked goodness.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          From our home kitchen to yours
        </h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
        For over 26 years, we’ve been serving fresh, delicious, and affordable meals to our valued customers in downtown Toronto. At Ginger, we believe that great food starts with the finest ingredients, prepared fresh to order and customized to your taste. Whether you&apos;re craving a hearty bowl of pho, a flavorful stir-fry, or a classic Vietnamese banh mi, we are committed to delivering quality and value in every bite.
        </p>
        <p className="text-[15px] leading-relaxed text-neutral-700">
        Our love for authentic flavors has taken us back to our roots, where we learned the art of baking traditional banh mi. Now, we proudly bake our banh mi fresh in-house every day to bring you the perfect combination of crispiness and softness.
        </p>
        <p className="text-[15px] leading-relaxed text-neutral-700">
        Every morning, we wake up early to slow cook the broth for our pho, and offer freshly made baguettes from scratch.
        </p>

        <VideoEmbed
          vimeoId="1187467908"
          title="Slow-cooking the pho broth at Ginger Cuisine"
          posterSrc="/images/environment-photos/pho-making-poster.jpg"
          caption="A weekday morning in our kitchen — slow-cooking the pho broth."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Photo gallery
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.src}
              className="group relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-emerald-50 to-rose-100 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

