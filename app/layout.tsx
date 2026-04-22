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
        {children}
      </body>
    </html>
  );
}
