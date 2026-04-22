import { RESTAURANT_NAME } from "@/lib/config";
import { hasDashboardSession } from "@/lib/requireDashboardSession";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function DashboardLoginPage() {
  if (await hasDashboardSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="mb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Staff only
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            {RESTAURANT_NAME} Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Enter the staff password to view incoming online orders.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
