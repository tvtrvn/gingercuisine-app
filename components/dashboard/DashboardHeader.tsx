"use client";

export function DashboardHeader({
  restaurantName,
}: {
  restaurantName: string;
}) {
  async function handleLogout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    window.location.href = "/dashboard/login";
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
          Restaurant dashboard
        </p>
        <h1 className="text-lg font-bold tracking-tight text-neutral-900">
          {restaurantName} · Online orders
        </h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="hidden sm:inline">Pay-in-person orders from website</span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
