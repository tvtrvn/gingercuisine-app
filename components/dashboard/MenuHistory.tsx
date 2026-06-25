"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { MenuAuditEntry, MenuFieldChange } from "@/lib/menuStore";

const PAGE_SIZE = 25;

const ACTION: Record<
  MenuAuditEntry["action"],
  { label: string; tone: BadgeProps["tone"] }
> = {
  add: { label: "Added", tone: "success" },
  override: { label: "Updated", tone: "warning" },
  edit: { label: "Updated", tone: "info" },
  delete: { label: "Deleted", tone: "danger" },
};

/** "2h ago" / "just now" — coarse on purpose; the exact time is in the title. */
function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

/** Day bucket label: Today / Yesterday / "Mon, Jun 23". */
function dayLabel(iso: string, now: number): string {
  const d = new Date(iso);
  const today = new Date(now);
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ChangeRow({ change }: { change: MenuFieldChange }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {change.label}
      </span>
      {change.from !== undefined && change.to !== undefined ? (
        <span className="text-sm">
          <span className="text-neutral-400 line-through">{change.from}</span>{" "}
          <span className="font-medium text-neutral-900">{change.to}</span>
        </span>
      ) : (
        <span className="text-sm font-medium text-neutral-900">
          {change.detail ?? change.to}
        </span>
      )}
    </div>
  );
}

function EntryCard({ entry, now }: { entry: MenuAuditEntry; now: number }) {
  const action = ACTION[entry.action] ?? ACTION.edit;
  const hasStructured = !!entry.changes && entry.changes.length > 0;
  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={action.tone}>{action.label}</Badge>
        <span
          className="shrink-0 text-xs text-neutral-400"
          title={new Date(entry.at).toLocaleString()}
        >
          {relativeTime(entry.at, now)}
        </span>
      </div>
      {entry.itemName && (
        <p className="mt-2 truncate text-sm font-semibold text-neutral-900">
          {entry.itemName}
        </p>
      )}
      <div className="mt-1 space-y-1">
        {hasStructured ? (
          entry.changes!.map((c, i) => <ChangeRow key={i} change={c} />)
        ) : (
          <p className="text-sm text-neutral-700">{entry.summary}</p>
        )}
      </div>
    </li>
  );
}

export function MenuHistory({
  restaurantName,
  entries,
}: {
  restaurantName: string;
  entries: MenuAuditEntry[];
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  // Single client-render timestamp keeps every relative label consistent and
  // avoids a hydration mismatch from per-row Date.now() calls.
  const [now] = useState(() => Date.now());

  const shown = entries.slice(0, visible);

  // Group the visible slice into consecutive day buckets (entries arrive newest
  // first, so buckets stay in order).
  const groups: { label: string; items: MenuAuditEntry[] }[] = [];
  for (const entry of shown) {
    const label = dayLabel(entry.at, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/menu"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to menu management
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
          Change history
        </h1>
        <p className="text-sm text-neutral-600">
          {restaurantName} — every menu edit, newest first.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          No changes recorded yet. Edits to menu items will appear here.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {group.label}
              </h2>
              <ul className="space-y-2">
                {group.items.map((entry, i) => (
                  <EntryCard key={`${entry.at}-${i}`} entry={entry} now={now} />
                ))}
              </ul>
            </section>
          ))}

          {visible < entries.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show older ({entries.length - visible} more)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
