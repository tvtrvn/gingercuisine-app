import { RESTAURANT_NAME, SITE_URL } from "@/lib/config";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} ${geistMono.variable} font-sans bg-neutral-50 text-neutral-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
