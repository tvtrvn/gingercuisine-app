"use client";

import { ACTIVE_ORDER_STATUSES, Order, OrderStatus } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewOrderToast } from "./NewOrderToast";
import { OrderCard } from "./OrderCard";
import { OrderDetailsDrawer } from "./OrderDetailsDrawer";
import { useNewOrderAlarm } from "./useNewOrderAlarm";

type SortMode = "newest" | "oldest" | "pickup";
type ScopeMode = "active" | "all";

const COLUMN_DEFS: { status: OrderStatus; label: string; accent: string }[] = [
  { status: "new", label: "New", accent: "from-rose-100 to-white" },
  {
    status: "acknowledged",
    label: "Acknowledged",
    accent: "from-amber-100 to-white",
  },
  { status: "ready", label: "Ready", accent: "from-emerald-100 to-white" },
  {
    status: "completed",
    label: "Completed",
    accent: "from-neutral-100 to-white",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    accent: "from-neutral-200 to-white",
  },
];

interface OrderBoardProps {
  initialOrders: Order[];
  pollIntervalMs: number;
  historyWindowHours: number;
}

export function OrderBoard({
  initialOrders,
  pollIntervalMs,
  historyWindowHours,
}: OrderBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [scope, setScope] = useState<ScopeMode>("active");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toastOrder, setToastOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<string>(
    new Date().toISOString(),
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Search (older orders, DB-backed) ---
  const [searchResults, setSearchResults] = useState<Order[] | null>(null);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const isSearchMode = debouncedSearch.length >= 2;

  // Track every order ID ever seen so we can detect genuinely new orders
  // without firing a toast on reload or for orders seen on a prior poll.
  const seenIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id)),
  );
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(
        `/api/dashboard/orders?windowHours=${historyWindowHours}&limit=500`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        orders: Order[];
        serverTime: string;
      };
      setOrders(data.orders);
      setLastFetchAt(data.serverTime);
      setFetchError(null);

      // Detect brand-new orders (placed since board mounted) and notify once.
      const freshNewOrders = data.orders
        .filter(
          (o) =>
            !seenIdsRef.current.has(o.id) &&
            o.orderStatus === "new" &&
            !notifiedIdsRef.current.has(o.id),
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      data.orders.forEach((o) => seenIdsRef.current.add(o.id));

      if (freshNewOrders.length > 0) {
        const latest = freshNewOrders[freshNewOrders.length - 1];
        notifiedIdsRef.current.add(latest.id);
        setToastOrder(latest);
      }
    } catch (err) {
      console.error("[OrderBoard] poll failed:", err);
      setFetchError("Couldn’t refresh orders. Retrying…");
    } finally {
      setIsFetching(false);
    }
  }, [historyWindowHours]);

  // Poll only when we're NOT in search mode. Search mode freezes the board
  // so staff can focus on results without the list shifting underneath them.
  useEffect(() => {
    if (isSearchMode) return;
    const id = setInterval(fetchOrders, pollIntervalMs);
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchOrders, pollIntervalMs, isSearchMode]);

  // Debounced DB search when the user types 2+ chars.
  useEffect(() => {
    if (!isSearchMode) {
      setSearchResults(null);
      setSearchError(null);
      setSearchTruncated(false);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);
    fetch(
      `/api/dashboard/orders/search?q=${encodeURIComponent(debouncedSearch)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          orders: Order[];
          truncated?: boolean;
        };
        setSearchResults(data.orders);
        setSearchTruncated(!!data.truncated);
      })
      .catch((err) => {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("[OrderBoard] search failed:", err);
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
      })
      .finally(() => setIsSearching(false));
    return () => controller.abort();
  }, [debouncedSearch, isSearchMode]);

  const patchOrder = useCallback(
    async (
      orderId: string,
      body: {
        orderStatus?: OrderStatus;
      },
    ) => {
      setUpdatingId(orderId);
      // Optimistic update — apply to whichever list the order lives in.
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...body } : o)),
      );
      setSearchResults((prev) =>
        prev
          ? prev.map((o) => (o.id === orderId ? { ...o, ...body } : o))
          : prev,
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, ...body } : prev,
      );

      try {
        const res = await fetch(`/api/dashboard/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { order: Order };
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o)),
        );
        setSearchResults((prev) =>
          prev
            ? prev.map((o) => (o.id === data.order.id ? data.order : o))
            : prev,
        );
        setSelectedOrder((prev) =>
          prev && prev.id === data.order.id ? data.order : prev,
        );
      } catch (err) {
        console.error("[OrderBoard] patch failed:", err);
        if (!isSearchMode) fetchOrders();
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchOrders, isSearchMode],
  );

  const handleUpdateStatus = useCallback(
    (orderId: string, next: OrderStatus) => {
      patchOrder(orderId, { orderStatus: next });
    },
    [patchOrder],
  );

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      patchOrder(orderId, { orderStatus: "cancelled" });
      setSelectedOrder(null);
    },
    [patchOrder],
  );

  const filteredBoardOrders = useMemo(() => {
    let list = orders;

    if (scope === "active") {
      list = list.filter((o) =>
        ACTIVE_ORDER_STATUSES.includes(o.orderStatus),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }

    const sorted = [...list];
    if (sortMode === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortMode === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else {
      sorted.sort((a, b) => {
        const aKey =
          a.pickupDetails.pickupTimeOption === "asap"
            ? "00:00"
            : a.pickupDetails.pickupTime ?? "99:99";
        const bKey =
          b.pickupDetails.pickupTimeOption === "asap"
            ? "00:00"
            : b.pickupDetails.pickupTime ?? "99:99";
        return aKey.localeCompare(bKey);
      });
    }
    return sorted;
  }, [orders, scope, statusFilter, sortMode]);

  const newCount = useMemo(
    () => orders.filter((o) => o.orderStatus === "new").length,
    [orders],
  );

  const { needsGesture } = useNewOrderAlarm(newCount > 0);

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = {
      new: 0,
      acknowledged: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  const visibleColumns = useMemo(() => {
    if (scope === "active") {
      return COLUMN_DEFS.filter((c) =>
        ACTIVE_ORDER_STATUSES.includes(c.status),
      );
    }
    return COLUMN_DEFS;
  }, [scope]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScope("active")}
              disabled={isSearchMode}
              className={`rounded-full px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                scope === "active"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600"
              }`}
            >
              Active only
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              disabled={isSearchMode}
              className={`rounded-full px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                scope === "all"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600"
              }`}
            >
              Last {historyWindowHours}h
            </button>
          </div>

          <label className="text-xs font-medium text-neutral-600">
            Status
            <select
              value={statusFilter}
              disabled={isSearchMode}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className="ml-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All</option>
              {COLUMN_DEFS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.label} ({counts[c.status] ?? 0})
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-neutral-600">
            Sort
            <select
              value={sortMode}
              disabled={isSearchMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="ml-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="pickup">By pickup time</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="search"
              placeholder="Search older orders (name, phone, #)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-full border border-neutral-300 px-3 py-1.5 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Search all orders"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {!isSearchMode && (
            <button
              type="button"
              onClick={fetchOrders}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  fetchError
                    ? "bg-rose-500"
                    : isFetching
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500"
                }`}
                aria-hidden
              />
              Refresh
            </button>
          )}
          <p className="text-[11px] text-neutral-500">
            {isSearchMode
              ? isSearching
                ? "Searching…"
                : `${searchResults?.length ?? 0} result${
                    (searchResults?.length ?? 0) === 1 ? "" : "s"
                  }${searchTruncated ? "+" : ""}`
              : `Last sync ${new Date(lastFetchAt).toLocaleTimeString()}`}
          </p>
        </div>
      </div>

      {needsGesture && newCount > 0 && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Tap or click anywhere to enable new-order sound.
        </p>
      )}

      {/* Contextual banner */}
      {!isSearchMode && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Showing all active orders plus completed/cancelled from the last{" "}
          <strong>{historyWindowHours} hours</strong>. To find older orders,
          type a name, phone number, or order # in the search box.
        </p>
      )}
      {isSearchMode && searchTruncated && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Showing the first {searchResults?.length ?? 0} matches. Narrow your
          search for more specific results.
        </p>
      )}
      {fetchError && !isSearchMode && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {fetchError}
        </p>
      )}
      {searchError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {searchError}
        </p>
      )}

      {/* Search results view */}
      {isSearchMode ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          {isSearching && (searchResults === null || searchResults.length === 0) && (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white/50 px-3 py-8 text-center text-sm text-neutral-500">
              Searching…
            </p>
          )}
          {!isSearching && searchResults && searchResults.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white/50 px-3 py-8 text-center text-sm text-neutral-500">
              No orders matched &ldquo;{debouncedSearch}&rdquo;.
            </p>
          )}
          {searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isNewUnacknowledged={false}
                  onOpenDetails={(o) => setSelectedOrder(o)}
                  onUpdateStatus={handleUpdateStatus}
                  disabled={updatingId === order.id}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Kanban board view */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleColumns.map((col) => {
            const columnOrders = filteredBoardOrders.filter(
              (o) => o.orderStatus === col.status,
            );
            return (
              <section
                key={col.status}
                className={`flex flex-col rounded-2xl border border-neutral-200 bg-gradient-to-b ${col.accent} p-3`}
                aria-label={`${col.label} orders`}
              >
                <header className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                    {col.label}
                  </h2>
                  <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                    {columnOrders.length}
                  </span>
                </header>
                <div className="space-y-3">
                  {columnOrders.length === 0 && (
                    <p className="rounded-xl border border-dashed border-neutral-300 bg-white/50 px-3 py-6 text-center text-xs text-neutral-500">
                      No orders
                    </p>
                  )}
                  {columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isNewUnacknowledged={order.orderStatus === "new"}
                      onOpenDetails={(o) => setSelectedOrder(o)}
                      onUpdateStatus={handleUpdateStatus}
                      disabled={updatingId === order.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onCancelOrder={handleCancelOrder}
      />

      <NewOrderToast
        order={toastOrder}
        onDismiss={() => setToastOrder(null)}
        onView={(o) => {
          setToastOrder(null);
          setSelectedOrder(o);
        }}
      />
    </div>
  );
}

// Small local hook — trims React state churn while the user is still typing.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
