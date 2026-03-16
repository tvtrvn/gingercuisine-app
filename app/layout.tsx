import { CartProvider } from "@/components/cart/cart-context";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { Footer } from "@/components/layout/Footer";
import { MainNav } from "@/components/layout/MainNav";
import { StickyOrderButton } from "@/components/layout/StickyOrderButton";
import { RESTAURANT_NAME, SITE_URL } from "@/lib/config";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${RESTAURANT_NAME} | Vietnamese Kitchen`,
  description:
    "Modern, family-run Vietnamese restaurant offering pho, bánh mì, rice plates, and vermicelli bowls with easy online pickup ordering.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${RESTAURANT_NAME} | Vietnamese Kitchen`,
    description:
      "Order pho, bánh mì, and more for pickup from our family Vietnamese restaurant.",
    url: SITE_URL,
    siteName: RESTAURANT_NAME,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-50 text-neutral-900 antialiased`}
      >
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <MainNav restaurantName={RESTAURANT_NAME} />
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
                {children}
              </div>
            </main>
            <Footer />
            <StickyOrderButton />
            <FloatingCart />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}

