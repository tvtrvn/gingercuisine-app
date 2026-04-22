import { z } from "zod";

const PICKUP_START_TIME = "11:30";
const PICKUP_END_TIME = "22:45";

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
  phone: z.string().trim().min(5, "Phone is required").max(30),
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

    if (value.pickupTime < PICKUP_START_TIME || value.pickupTime > PICKUP_END_TIME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTime"],
        message: "Pickup time must be between 11:30 AM and 10:45 PM.",
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
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export const posEntryStatusSchema = z.enum(["not_entered", "entered"]);

export const orderUpdateSchema = z
  .object({
    orderStatus: orderStatusSchema.optional(),
    posEntryStatus: posEntryStatusSchema.optional(),
    staffNote: z.string().max(500).optional(),
    paymentStatus: z.enum(["unpaid", "paid"]).optional(),
  })
  .refine(
    (v) =>
      v.orderStatus !== undefined ||
      v.posEntryStatus !== undefined ||
      v.staffNote !== undefined ||
      v.paymentStatus !== undefined,
    { message: "No update fields provided." },
  );

export const dashboardLoginSchema = z.object({
  password: z.string().min(1, "Password is required").max(200),
});

export type CartSelectionInput = z.infer<typeof cartSelectionSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
