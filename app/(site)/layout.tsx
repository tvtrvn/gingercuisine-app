import { CartProvider } from "@/components/cart/cart-context";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { Footer } from "@/components/layout/Footer";
import { MainNav } from "@/components/layout/MainNav";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { StickyOrderButton } from "@/components/layout/StickyOrderButton";
import { RESTAURANT_NAME, TAX_RATE } from "@/lib/config";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Server component: TAX_RATE here reads the real env value, so the cart's
    // display totals always match what /api/order will charge.
    <CartProvider taxRate={TAX_RATE}>
      <div className="flex min-h-screen flex-col">
        <MainNav restaurantName={RESTAURANT_NAME} />
        {/* Extra bottom padding on mobile keeps the fixed cart FAB (right-4,
            ~bottom-20) and the sticky order bar (bottom-4) from ever resting on
            top of real content — headings on /menu, trust copy on /. iOS home
            indicator is cleared via env(safe-area-inset-bottom). */}
        <main className="flex-1 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
            {children}
          </div>
        </main>
        <Footer />
        <StickyOrderButton />
        <ScrollToTopButton />
        <FloatingCart />
      </div>
    </CartProvider>
  );
}
