"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, History, Plus, Trash2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { menuCategories } from "@/data/menu";
import type {
  AddonOption,
  DietaryTag,
  MenuCategoryId,
  MenuItem,
  SizeOption,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const DIETARY_TAGS: DietaryTag[] = ["spicy", "vegetarian", "vegan"];
const categoryLabel = new Map(menuCategories.map((c) => [c.id, c.name]));

function isCustom(item: MenuItem): boolean {
  return item.id.startsWith("custom-");
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "opt"
  );
}

/** POST/PATCH/DELETE helper that surfaces the server's error message. */
async function mutate(
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
): Promise<void> {
  const res = await fetch("/api/dashboard/menu", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

// ───────────────────────── Option list editor (custom items) ─────────────

interface OptionDraft {
  text: string; // size label OR addon/flavor name
  price: string; // priceDelta (size) OR price (addon/flavor)
  soldOut: boolean;
}

function OptionListEditor({
  title,
  priceLabel,
  options,
  onChange,
}: {
  title: string;
  priceLabel: string;
  options: OptionDraft[];
  onChange: (next: OptionDraft[]) => void;
}) {
  function update(i: number, patch: Partial<OptionDraft>) {
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {title}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange([...options, { text: "", price: "0", soldOut: false }])}
          iconLeft={<Plus className="h-3.5 w-3.5" aria-hidden />}
        >
          Add
        </Button>
      </div>
      {options.length === 0 && (
        <p className="text-xs text-neutral-400">None.</p>
      )}
      {options.map((opt, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem] flex-1">
            <Input
              aria-label={`${title} name`}
              value={opt.text}
              placeholder="Name"
              onChange={(e) => update(i, { text: e.target.value })}
            />
          </div>
          <div className="w-24">
            <Input
              aria-label={priceLabel}
              type="number"
              step="0.01"
              min="0"
              value={opt.price}
              onChange={(e) => update(i, { price: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-1 pb-2.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={opt.soldOut}
              onChange={(e) => update(i, { soldOut: e.target.checked })}
            />
            Sold out
          </label>
          <button
            type="button"
            aria-label="Remove option"
            className="pb-2 text-neutral-400 hover:text-red-600"
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Custom item form (add + edit) ─────────────────

interface ItemFormProps {
  initial?: MenuItem;
  onCancel: () => void;
  onSubmit: (fields: Omit<MenuItem, "id">) => Promise<void>;
}

function toDrafts(opts: AddonOption[] | undefined): OptionDraft[] {
  return (opts ?? []).map((o) => ({
    text: o.name,
    price: String(o.price),
    soldOut: !!o.soldOut,
  }));
}
function sizesToDrafts(opts: SizeOption[] | undefined): OptionDraft[] {
  return (opts ?? []).map((o) => ({
    text: o.label,
    price: String(o.priceDelta),
    soldOut: !!o.soldOut,
  }));
}

function ItemForm({ initial, onCancel, onSubmit }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vietnameseName, setVn] = useState(initial?.vietnameseName ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? menuCategories[0].id,
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(
    initial ? String(initial.price) : "",
  );
  const [available, setAvailable] = useState(initial?.available !== false);
  const [image, setImage] = useState(initial?.image ?? "");
  const [tags, setTags] = useState<DietaryTag[]>(initial?.tags ?? []);
  const [sizes, setSizes] = useState<OptionDraft[]>(
    sizesToDrafts(initial?.availableSizes),
  );
  const [flavors, setFlavors] = useState<OptionDraft[]>(
    toDrafts(initial?.availableFlavors),
  );
  const [addons, setAddons] = useState<OptionDraft[]>(
    toDrafts(initial?.availableAddons),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function buildOptions(
    drafts: OptionDraft[],
    kind: "size" | "priced",
  ): (AddonOption | SizeOption)[] {
    const seen = new Set<string>();
    return drafts
      .filter((d) => d.text.trim())
      .map((d) => {
        let id = slugify(d.text);
        while (seen.has(id)) id = `${id}-x`;
        seen.add(id);
        const value = Number(d.price) || 0;
        return kind === "size"
          ? { id, label: d.text.trim(), priceDelta: value, soldOut: d.soldOut || undefined }
          : { id, name: d.text.trim(), price: value, soldOut: d.soldOut || undefined };
      });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/menu/upload", {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
      setImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    const priceNum = Number(price);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return setError("Enter a valid price.");

    const builtSizes = buildOptions(sizes, "size") as SizeOption[];
    const builtFlavors = buildOptions(flavors, "priced") as AddonOption[];
    const builtAddons = buildOptions(addons, "priced") as AddonOption[];

    const fields: Omit<MenuItem, "id"> = {
      name: name.trim(),
      vietnameseName: vietnameseName.trim() || undefined,
      categoryId,
      description: description.trim(),
      price: priceNum,
      available: available ? undefined : false,
      image: image.trim() || undefined,
      tags: tags.length ? tags : undefined,
      availableSizes: builtSizes.length ? builtSizes : undefined,
      defaultSizeId: builtSizes.length ? builtSizes[0].id : undefined,
      availableFlavors: builtFlavors.length ? builtFlavors : undefined,
      availableAddons: builtAddons.length ? builtAddons : undefined,
    };

    setSaving(true);
    try {
      await onSubmit(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-brand-200">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            {initial ? `Edit "${initial.name}"` : "Add a new item"}
          </h3>
          <button
            type="button"
            aria-label="Close form"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            data-testid="form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Vietnamese name (optional)"
            value={vietnameseName}
            onChange={(e) => setVn(e.target.value)}
          />
          <Select
            label="Category"
            data-testid="form-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value as MenuItem["categoryId"])}
          >
            {menuCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Price"
            data-testid="form-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <Textarea
          label="Description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={!available}
              onChange={(e) => setAvailable(!e.target.checked)}
            />
            Sold out
          </label>
          <div className="flex flex-wrap gap-3">
            {DIETARY_TAGS.map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={tags.includes(t)}
                  onChange={(e) =>
                    setTags((prev) =>
                      e.target.checked ? [...prev, t] : prev.filter((x) => x !== t),
                    )
                  }
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Photo (optional)
          </p>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {image ? (
                <Image src={image} alt="" fill className="object-cover" sizes="4rem" />
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              iconLeft={<Upload className="h-3.5 w-3.5" aria-hidden />}
            >
              {image ? "Replace" : "Upload"}
            </Button>
            {image && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setImage("")}>
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <OptionListEditor title="Sizes" priceLabel="Price delta" options={sizes} onChange={setSizes} />
          <OptionListEditor title="Flavors" priceLabel="Price" options={flavors} onChange={setFlavors} />
          <OptionListEditor title="Add-ons" priceLabel="Price" options={addons} onChange={setAddons} />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="form-submit"
            loading={saving}
            onClick={() => void handleSubmit()}
          >
            {initial ? "Save changes" : "Add item"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ───────────────────────── Base item override panel ──────────────────────

function BaseOverridePanel({
  item,
  onCancel,
  onSave,
}: {
  item: MenuItem;
  onCancel: () => void;
  onSave: (patch: {
    available: boolean;
    price: number;
    name: string;
    description: string;
    soldOutOptionIds: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(String(item.price));
  const [available, setAvailable] = useState(item.available !== false);
  const allOptions = [
    ...(item.availableSizes ?? []).map((s) => ({ id: s.id, label: s.label, soldOut: !!s.soldOut })),
    ...(item.availableFlavors ?? []).map((f) => ({ id: f.id, label: f.name, soldOut: !!f.soldOut })),
    ...(item.availableAddons ?? []).map((a) => ({ id: a.id, label: a.name, soldOut: !!a.soldOut })),
  ];
  const [soldOutIds, setSoldOutIds] = useState<string[]>(
    allOptions.filter((o) => o.soldOut).map((o) => o.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const priceNum = Number(price);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Enter a valid price.");
    setSaving(true);
    try {
      await onSave({
        available,
        price: priceNum,
        name: name.trim(),
        description: description.trim(),
        soldOutOptionIds: soldOutIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-neutral-100 bg-neutral-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Name"
          data-testid="ov-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Price"
          data-testid="ov-price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <Textarea
        label="Description"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          data-testid="ov-soldout"
          checked={!available}
          onChange={(e) => setAvailable(!e.target.checked)}
        />
        Sold out (whole item)
      </label>

      {allOptions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Sold-out options
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {allOptions.map((o) => (
              <label key={o.id} className="flex items-center gap-1.5 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={soldOutIds.includes(o.id)}
                  onChange={(e) =>
                    setSoldOutIds((prev) =>
                      e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          data-testid="ov-save"
          loading={saving}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Main ──────────────────────────────────────────

export function MenuManager({
  restaurantName,
  initialItems,
}: {
  restaurantName: string;
  initialItems: MenuItem[];
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategoryId | "all">("all");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/dashboard/menu", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items as MenuItem[]);
    } catch {
      /* leave current state; the next action will retry */
    }
  }

  function flash(msg: string) {
    setStatus(msg);
    window.setTimeout(() => setStatus((s) => (s === msg ? null : s)), 4000);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (category !== "all" && i.categoryId !== category) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.vietnameseName?.toLowerCase().includes(q) ||
        (categoryLabel.get(i.categoryId) ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, category]);

  async function addItem(fields: Omit<MenuItem, "id">) {
    await mutate("POST", fields);
    setAdding(false);
    await refresh();
    flash("Item added.");
  }

  async function editCustom(itemId: string, fields: Omit<MenuItem, "id">) {
    await mutate("PATCH", { kind: "customEdit", itemId, patch: fields });
    setEditingId(null);
    await refresh();
    flash("Item updated.");
  }

  async function saveOverride(
    itemId: string,
    patch: {
      available: boolean;
      price: number;
      name: string;
      description: string;
      soldOutOptionIds: string[];
    },
  ) {
    await mutate("PATCH", { kind: "override", itemId, patch });
    setOverrideId(null);
    await refresh();
    flash("Changes saved.");
  }

  async function deleteCustom(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await mutate("DELETE", { itemId: item.id });
      await refresh();
      flash("Item deleted.");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to orders
          </Link>
          <Link
            href="/dashboard/menu/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <History className="h-3.5 w-3.5" aria-hidden />
            Change history
          </Link>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
          Menu management
        </h1>
        <p className="text-sm text-neutral-600">
          {restaurantName} — mark items or options sold out, adjust prices, and
          add your own dishes. Changes appear on the customer site immediately.
        </p>
      </header>

      {status && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {status}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex w-full max-w-md flex-wrap items-end gap-3">
          <div className="min-w-[10rem] flex-1">
            <Input
              type="search"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <Select
              aria-label="Filter by category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as MenuCategoryId | "all")
              }
            >
              <option value="all">All categories</option>
              {menuCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {!adding && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
              setOverrideId(null);
            }}
            iconLeft={<Plus className="h-4 w-4" aria-hidden />}
          >
            Add item
          </Button>
        )}
      </div>

      {adding && (
        <ItemForm onCancel={() => setAdding(false)} onSubmit={addItem} />
      )}

      <div className="space-y-2">
        {filtered.map((item) => {
          const custom = isCustom(item);
          const soldOut = item.available === false;
          return (
            <Card key={item.id} data-testid={`row-${item.id}`} className="overflow-hidden">
              {editingId === item.id ? (
                <CardBody>
                  <ItemForm
                    initial={item}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(fields) => editCustom(item.id, fields)}
                  />
                </CardBody>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3 p-3 md:p-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                      {item.image ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="3rem" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {item.name}
                        </p>
                        {custom && <Badge tone="brand" className="text-[10px]">Custom</Badge>}
                        {soldOut && <Badge tone="danger" className="text-[10px]">Sold out</Badge>}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {categoryLabel.get(item.categoryId) ?? item.categoryId} ·{" "}
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {custom ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(item.id);
                              setOverrideId(null);
                              setAdding(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            aria-label="Delete item"
                            onClick={() => void deleteCustom(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setOverrideId((id) => (id === item.id ? null : item.id))
                          }
                        >
                          {overrideId === item.id ? "Close" : "Edit"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {overrideId === item.id && !custom && (
                    <BaseOverridePanel
                      item={item}
                      onCancel={() => setOverrideId(null)}
                      onSave={(patch) => saveOverride(item.id, patch)}
                    />
                  )}
                </>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-500">No items match.</p>
        )}
      </div>
    </div>
  );
}
