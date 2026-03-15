import { z } from "zod";
import { PaymentMethod } from "./types";

const addonOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
});

const sizeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  priceDelta: z.number(),
});

const PICKUP_START_TIME = "11:30";
const PICKUP_END_TIME = "22:45";

export const cartItemSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  name: z.string(),
  basePrice: z.number().nonnegative(),
  price: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  notes: z.string().max(300).optional(),
  selectedAddons: z.array(addonOptionSchema).optional(),
  selectedSize: sizeOptionSchema.optional(),
});

export const pickupDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  pickupTimeOption: z.enum(["asap", "later"]),
  pickupTime: z.string().optional(),
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

export const paymentMethodSchema = z.custom<PaymentMethod>((val) =>
  val === "pay_at_pickup" || val === "stripe",
);

export const orderRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  pickupDetails: pickupDetailsSchema,
  paymentMethod: paymentMethodSchema,
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  message: z.string().min(5, "Message is too short").max(2000),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;

