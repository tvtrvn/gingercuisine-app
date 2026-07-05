import { z } from "zod";

import { PHONE_DEFAULT_REGION } from "./config";
import { HOURS_TIMEZONE } from "./hours";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { MenuCategoryId } from "./types";

const PICKUP_START_TIME = "11:30";
const PICKUP_END_TIME = "22:45";

// Strict HH:MM (24h). Without this, the lexical window comparison below lets
// malformed strings like "1a:00" through because they happen to sort in-range.
const PICKUP_TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Current wall-clock time in the restaurant's timezone, as sortable "HH:MM". */
function currentLocalHHMM(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HOURS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  // Some engines render midnight as "24" with hour12: false.
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${hour}:${get("minute")}`;
}

const MAX_CART_LINES = 50;
const MAX_QTY_PER_LINE = 25;
const MAX_ADDONS_PER_LINE = 20;
const MAX_NOTES_LEN = 300;

/**
 * Client-submitted cart line. We intentionally DO NOT accept prices,
 * names, or any money-related fields from the client. The server
 * recomputes everything from `data/menu.ts` via `lib/pricing.ts`.
 */
export const cartSelectionSchema = z.object({
  menuItemId: z.string().min(1).max(120),
  quantity: z.number().int().positive().max(MAX_QTY_PER_LINE),
  notes: z.string().max(MAX_NOTES_LEN).optional(),
  selectedSizeId: z.string().max(80).optional(),
  selectedAddonIds: z.array(z.string().max(80)).max(MAX_ADDONS_PER_LINE).optional(),
  selectedFlavorId: z.string().max(80).optional(),
});

export const pickupDetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .superRefine((val, ctx) => {
      const parsed = parsePhoneNumberFromString(val, PHONE_DEFAULT_REGION);
      if (!parsed?.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid phone number.",
        });
      }
    })
    .transform((val) => {
      const parsed = parsePhoneNumberFromString(val, PHONE_DEFAULT_REGION);
      return parsed!.number;
    }),
  email: z
    .string()
    .trim()
    .max(120)
    .email()
    .optional()
    .or(z.literal("")),
  pickupTimeOption: z.enum(["asap", "later"]),
  pickupTime: z.string().max(10).optional(),
}).superRefine((value, ctx) => {
  if (value.pickupTimeOption === "later") {
    if (!value.pickupTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTime"],
        message: "Please choose a pickup time.",
      });
      return;
    }

    if (!PICKUP_TIME_FORMAT.test(value.pickupTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTime"],
        message: "Please choose a valid pickup time.",
      });
      return;
    }

    if (value.pickupTime < PICKUP_START_TIME || value.pickupTime > PICKUP_END_TIME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTime"],
        message: "Pickup time must be between 11:30 AM and 10:45 PM.",
      });
      return;
    }

    if (value.pickupTime < currentLocalHHMM()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTime"],
        message:
          "That pickup time has already passed today. Pick a later time or choose ASAP.",
      });
    }
  }
});

export const orderRequestSchema = z.object({
  items: z
    .array(cartSelectionSchema)
    .min(1, "Cart cannot be empty")
    .max(MAX_CART_LINES, `Cart cannot exceed ${MAX_CART_LINES} lines.`),
  pickupDetails: pickupDetailsSchema,
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().max(120).email("A valid email is required"),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

// ---- Dashboard / staff side ----

export const orderStatusSchema = z.enum([
  "new",
  "acknowledged",
  "ready",
  "completed",
  "cancelled",
]);

export const orderUpdateSchema = z
  .object({
    orderStatus: orderStatusSchema.optional(),
    staffNote: z.string().max(500).optional(),
    paymentStatus: z.enum(["unpaid", "paid"]).optional(),
  })
  .refine(
    (v) =>
      v.orderStatus !== undefined ||
      v.staffNote !== undefined ||
      v.paymentStatus !== undefined,
    { message: "No update fields provided." },
  );

export const dashboardLoginSchema = z.object({
  password: z.string().min(1, "Password is required").max(200),
});

/**
 * Body for `POST /api/dashboard/orders/pause`. Staff can toggle the pause
 * flag on or off, optionally attaching a short reason (shown to customers
 * on the order page banner).
 */
export const orderingPauseUpdateSchema = z.object({
  paused: z.boolean(),
  reason: z.string().trim().max(200).optional(),
});

// ---- Owner menu management ----

// Kept in sync with the `MenuCategoryId` union in lib/types.ts. The `satisfies`
// check fails to compile if any id here isn't a real category.
const MENU_CATEGORY_IDS = [
  "pho",
  "tom-yum",
  "banh-mi",
  "rice-plates",
  "mango-salad",
  "vermicelli",
  "appetizers",
  "specialty-plates",
  "salmon-fried-fish",
  "sides",
  "drinks",
  "starter-soups",
  "desserts",
] as const satisfies readonly MenuCategoryId[];

const MAX_MENU_NAME = 120;
const MAX_MENU_DESC = 600;
const MAX_OPTIONS_PER_GROUP = 30;

const money = z.number().nonnegative().max(10_000);
const optionId = z.string().trim().min(1).max(80);

const addonOptionSchema = z.object({
  id: optionId,
  name: z.string().trim().min(1).max(80),
  price: money,
  soldOut: z.boolean().optional(),
});

const sizeOptionSchema = z.object({
  id: optionId,
  label: z.string().trim().min(1).max(80),
  priceDelta: money,
  soldOut: z.boolean().optional(),
});

function hasUniqueIds(arr: ReadonlyArray<{ id: string }>): boolean {
  return new Set(arr.map((o) => o.id)).size === arr.length;
}

/** A full owner-created menu item (no `id` — the store assigns a `custom-` id). */
export const customItemSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_MENU_NAME),
    vietnameseName: z.string().trim().max(MAX_MENU_NAME).optional(),
    categoryId: z.enum(MENU_CATEGORY_IDS),
    description: z.string().trim().max(MAX_MENU_DESC),
    price: money,
    available: z.boolean().optional(),
    image: z.string().trim().url().max(500).optional(),
    tags: z.array(z.enum(["spicy", "vegetarian", "vegan"])).max(3).optional(),
    isFeatured: z.boolean().optional(),
    availableAddons: z
      .array(addonOptionSchema)
      .max(MAX_OPTIONS_PER_GROUP)
      .optional(),
    availableSizes: z
      .array(sizeOptionSchema)
      .max(MAX_OPTIONS_PER_GROUP)
      .optional(),
    defaultSizeId: optionId.optional(),
    availableFlavors: z
      .array(addonOptionSchema)
      .max(MAX_OPTIONS_PER_GROUP)
      .optional(),
  })
  .superRefine((v, ctx) => {
    for (const [key, arr] of [
      ["availableAddons", v.availableAddons],
      ["availableSizes", v.availableSizes],
      ["availableFlavors", v.availableFlavors],
    ] as const) {
      if (arr && !hasUniqueIds(arr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "Option ids must be unique.",
        });
      }
    }
    if (
      v.defaultSizeId &&
      !(v.availableSizes ?? []).some((s) => s.id === v.defaultSizeId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultSizeId"],
        message: "Default size must be one of the available sizes.",
      });
    }
  });

/** Owner edits to a base catalog item. At least one field must be present. */
export const overridePatchSchema = z
  .object({
    available: z.boolean().optional(),
    price: money.optional(),
    name: z.string().trim().min(1).max(MAX_MENU_NAME).optional(),
    description: z.string().trim().max(MAX_MENU_DESC).optional(),
    soldOutOptionIds: z.array(optionId).max(100).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "No override fields provided.",
  });

/** PATCH body for /api/dashboard/menu: override a base item OR edit a custom one. */
export const menuPatchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("override"),
    itemId: z.string().trim().min(1).max(120),
    patch: overridePatchSchema,
  }),
  z.object({
    kind: z.literal("customEdit"),
    itemId: z.string().trim().min(1).max(120),
    patch: customItemSchema,
  }),
]);

export const menuDeleteSchema = z.object({
  itemId: z.string().trim().min(1).max(120),
});

export type CartSelectionInput = z.infer<typeof cartSelectionSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type CustomItemInput = z.infer<typeof customItemSchema>;
export type OverridePatchInput = z.infer<typeof overridePatchSchema>;
export type MenuPatchInput = z.infer<typeof menuPatchSchema>;
