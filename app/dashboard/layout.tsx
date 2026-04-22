import { RESTAURANT_NAME } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${RESTAURANT_NAME} · Restaurant Dashboard`,
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {children}
    </div>
  );
}
