"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { ACTIVE_ORDER_STATUSES, Order, OrderStatus } from "@/lib/types";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardTopBar } from "./DashboardTopBar";
import { NewOrderToast } from "./NewOrderToast";
import { OrderCard } from "./OrderCard";
import { OrderDetailsDrawer } from "./OrderDetailsDrawer";
import { OrderingStatusBanner } from "./PauseOrdersControl";
import { useNewOrderAlarm } from "./useNewOrderAlarm";

type SortMode = "newest" | "oldest" | "pickup";
type ScopeMode = "active" | "all";

const COLUMN_DEFS: {
  status: OrderStatus;
  label: string;
  strip: string;
  headerTint: string;
}[] = [
  { status: "new", label: "New", strip: "bg-blue-600", headerTint: "text-blue-950" },
  {
    status: "acknowledged",
    label: "Acknowledged",
    strip: "bg-violet-600",
    headerTint: "text-violet-950",
  },
  {
    status: "ready",
    label: "Ready",
    strip: "bg-emerald-600",
    headerTint: "text-emerald-950",
  },
  {
    status: "completed",
    label: "Completed",
    strip: "bg-neutral-400",
    headerTint: "text-neutral-800",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    strip: "bg-red-500",
    headerTint: "text-red-950",
  },
];

interface InitialAvailability {
  accepting: boolean;
  reason?: string;
  message?: string;
  staffPaused: boolean;
  staffPauseReason?: string;
  staffPausedAt?: string;
}

interface OrderBoardProps {
  initialOrders: Order[];
  pollIntervalMs: number;
  historyWindowHours: number;
  restaurantName: string;
  initialAvailability: InitialAvailability;
}

export function OrderBoard({
  initialOrders,
  pollIntervalMs,
  historyWindowHours,
  restaurantName,
  initialAvailability,
}: OrderBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [scope, setScope] = useState<ScopeMode>("active");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toastOrder, setToastOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // `null` until the first poll lands. Initialising with `new Date()` here
  // would run on both the SSR pass and the hydration pass with a few
  // milliseconds between them and trigger a hydration mismatch on
  // `<time dateTime>` in the top bar. The fetch below populates it on mount.
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);

  const [searchResults, setSearchResults] = useState<Order[] | null>(null);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const isSearchMode = debouncedSearch.length >= 2;

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

  useEffect(() => {
    // Poll even while staff are searching — only the board RENDERING switches
    // to search results. If polling stopped in search mode, a forgotten search
    // box would silence the new-order chime/toast for every incoming order.
    // Kick an immediate fetch so the "Last sync" indicator (and any orders
    // placed between SSR and mount) populate within a few ms instead of
    // waiting a full poll interval.
    // Poll bootstrap: fetchOrders flips the isFetching flag synchronously;
    // one extra mount render is the accepted cost of an immediate first sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders();
    // Skip polling while the tab is hidden (backgrounded tablet) — the focus
    // listener refetches the moment it's foregrounded again.
    const id = setInterval(() => {
      if (!document.hidden) void fetchOrders();
    }, pollIntervalMs);
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchOrders, pollIntervalMs]);

  useEffect(() => {
    if (!isSearchMode) {
      // Reset is coupled to the DEBOUNCED search value, so it can't live in
      // the input handler without re-implementing the debounce.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        expectedStatus?: OrderStatus;
      },
    ) => {
      setUpdatingId(orderId);
      // Snapshot pre-update state so a failed PATCH can roll the optimistic
      // update back — the board must never keep showing a status the server
      // never accepted.
      let prevOrders: Order[] = [];
      let prevSearch: Order[] | null = null;
      let prevSelected: Order | null = null;
      // expectedStatus is a write guard for the server, not order state — keep
      // it out of the optimistic UI merge.
      const optimistic =
        body.orderStatus !== undefined ? { orderStatus: body.orderStatus } : {};
      setOrders((prev) => {
        prevOrders = prev;
        return prev.map((o) => (o.id === orderId ? { ...o, ...optimistic } : o));
      });
      setSearchResults((prev) => {
        prevSearch = prev;
        return prev
          ? prev.map((o) => (o.id === orderId ? { ...o, ...optimistic } : o))
          : prev;
      });
      setSelectedOrder((prev) => {
        prevSelected = prev;
        return prev && prev.id === orderId ? { ...prev, ...optimistic } : prev;
      });

      try {
        const res = await fetch(`/api/dashboard/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 409) {
          // Another tablet changed this order first. The response carries the
          // current row — sync to server truth instead of keeping our guess.
          const conflict = (await res.json()) as { order?: Order };
          if (conflict.order) {
            const current = conflict.order;
            setOrders((prev) =>
              prev.map((o) => (o.id === current.id ? current : o)),
            );
            setSearchResults((prev) =>
              prev
                ? prev.map((o) => (o.id === current.id ? current : o))
                : prev,
            );
            setSelectedOrder((prev) =>
              prev && prev.id === current.id ? current : prev,
            );
          } else {
            setOrders(prevOrders);
            setSearchResults(prevSearch);
            setSelectedOrder(prevSelected);
            void fetchOrders();
          }
          setFetchError(
            "This order was updated on another device — showing the latest state.",
          );
          return;
        }
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
        setOrders(prevOrders);
        setSearchResults(prevSearch);
        setSelectedOrder(prevSelected);
        setFetchError(
          "Couldn’t update the order. Check the connection and try again.",
        );
        void fetchOrders();
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchOrders],
  );

  const handleUpdateStatus = useCallback(
    (orderId: string, next: OrderStatus, expectedStatus?: OrderStatus) => {
      patchOrder(orderId, { orderStatus: next, expectedStatus });
    },
    [patchOrder],
  );

  const handleCancelOrder = useCallback(
    (orderId: string, expectedStatus?: OrderStatus) => {
      patchOrder(orderId, { orderStatus: "cancelled", expectedStatus });
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

  const { needsGesture } = useNewOrderAlarm(newCount > 0 && !soundMuted);

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
    <div className="space-y-0">
      {/* Full-screen flashing green alert while any order is unacknowledged.
          Independent of soundMuted so the visual cue stays even when staff
          mute the chime — that's the backup for "can't hear it". pointer-events
          -none keeps the Acknowledge buttons clickable; it auto-clears the
          moment the last "new" order is acknowledged (newCount -> 0). */}
      {newCount > 0 && (
        <div
          aria-hidden
          className="animate-dashboard-new-flash pointer-events-none fixed inset-0 z-[55] bg-green-500/25"
        />
      )}
      <OrderingStatusBanner initialAvailability={initialAvailability} />
      <DashboardTopBar
        restaurantName={restaurantName}
        counts={{
          new: counts.new,
          acknowledged: counts.acknowledged,
          ready: counts.ready,
        }}
        lastFetchAt={lastFetchAt}
        isFetching={isFetching}
        fetchError={fetchError}
        onRefresh={() => void fetchOrders()}
        soundMuted={soundMuted}
        onToggleSound={() => setSoundMuted((m) => !m)}
        needsGesture={needsGesture}
        newCount={newCount}
        initialAvailability={initialAvailability}
      />

      <div className="space-y-4 px-4 py-4 md:px-6 md:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScope("active")}
                disabled={isSearchMode}
                className={`rounded-lg px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 ${
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
                className={`rounded-lg px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  scope === "all"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600"
                }`}
              >
                Last {historyWindowHours}h
              </button>
            </div>

            <Select
              id="board-status-filter"
              label="Status"
              value={statusFilter}
              disabled={isSearchMode}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className="min-w-[10rem] text-xs font-semibold"
            >
              <option value="all">All</option>
              {COLUMN_DEFS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.label} ({counts[c.status] ?? 0})
                </option>
              ))}
            </Select>

            <Select
              id="board-sort-filter"
              label="Sort"
              value={sortMode}
              disabled={isSearchMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="min-w-[9rem] text-xs font-semibold"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="pickup">By pickup time</option>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-xs sm:shrink-0">
            <span className="text-xs font-medium text-neutral-700">
              Search older orders
            </span>
            <div className="flex items-center gap-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, or order #"
                className="min-w-0 flex-1"
                aria-label="Search all orders by name, phone, or order number"
              />
              {search.length > 0 && (
                <IconButton
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 sm:text-right">
          {isSearchMode
            ? isSearching
              ? "Searching…"
              : `${searchResults?.length ?? 0} result${
                  (searchResults?.length ?? 0) === 1 ? "" : "s"
                }${searchTruncated ? "+" : ""}`
            : null}
        </p>

        {!isSearchMode && (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
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
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {fetchError}
          </p>
        )}
        {searchError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {searchError}
          </p>
        )}

        {isSearchMode ? (
          <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-[var(--shadow-card)]">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleColumns.map((col) => {
              const columnOrders = filteredBoardOrders.filter(
                (o) => o.orderStatus === col.status,
              );
              return (
                <section
                  key={col.status}
                  className="flex max-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)]"
                  aria-label={`${col.label} orders`}
                >
                  <div className={`h-1 w-full shrink-0 ${col.strip}`} />
                  <header className="sticky top-0 z-[1] flex items-center justify-between gap-2 border-b border-neutral-100 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wide ${col.headerTint}`}
                    >
                      {col.label}
                    </h2>
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                      {columnOrders.length}
                    </span>
                  </header>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                    {columnOrders.length === 0 && (
                      <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-6 text-center text-xs text-neutral-500">
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
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
