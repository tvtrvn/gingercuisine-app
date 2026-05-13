import { CartProvider } from "@/components/cart/cart-context";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { Footer } from "@/components/layout/Footer";
import { MainNav } from "@/components/layout/MainNav";
import { StickyOrderButton } from "@/components/layout/StickyOrderButton";
import { RESTAURANT_NAME } from "@/lib/config";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <MainNav restaurantName={RESTAURANT_NAME} />
        <main className="flex-1 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
            {children}
          </div>
        </main>
        <Footer />
        <StickyOrderButton />
        <FloatingCart />
      </div>
    </CartProvider>
  );
}
