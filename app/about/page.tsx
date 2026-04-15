import Image from "next/image";

// Edit this array to add, remove, or reorder gallery photos.
const galleryPhotos = [
  { src: "/images/environment-photos/interior seating.jpg", alt: "Interior seating at Ginger Cuisine" },
  { src: "/images/environment-photos/pride-parade.webp", alt: "Ginger Cuisine at the Pride parade" },
  { src: "/images/Ginger-Food-Photos/rare-beef-pho-far.jpg", alt: "Classic beef pho" },
  { src: "/images/Ginger-Food-Photos/far-beef-banhmi copy.jpg", alt: "Beef bánh mì" },
  { src: "/images/Ginger-Food-Photos/chicken-shrimp-padthai.jpg", alt: "Chicken & shrimp pad thai" },
  { src: "/images/Ginger-Food-Photos/garlic-butter-lime-wings.jpg", alt: "Garlic butter lime wings" },
];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Welcome to Ginger Restaurant!
        </h1>
        <p className="max-w-2xl text-sm text-neutral-700">
          We started this business because we love Vietnamese food and we want to share it with you.
          Thank you for your continued support—we look forward to serving you for many more years to come! Visit any of our locations across downtown Toronto and enjoy a taste of home-cooked goodness.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
          From our home kitchen to yours
        </h2>
        <p className="text-sm text-neutral-700">
        For over 26 years, we’ve been serving fresh, delicious, and affordable meals to our valued customers in downtown Toronto. At Ginger, we believe that great food starts with the finest ingredients, prepared fresh to order and customized to your taste. Whether you&apos;re craving a hearty bowl of pho, a flavorful stir-fry, or a classic Vietnamese banh mi, we are committed to delivering quality and value in every bite.
        </p>
        <p className="text-sm text-neutral-700">
        Our love for authentic flavors has taken us back to our roots, where we learned the art of baking traditional banh mi. Now, we proudly bake our banh mi fresh in-house every day to bring you the perfect combination of crispiness and softness.
        </p>
        <p className="text-sm text-neutral-700">
        Every morning, we wake up early to slow cook the broth for our pho, and offer freshly made baguettes from scratch.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
          Photo gallery
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.src}
              className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-emerald-50 to-rose-100"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

