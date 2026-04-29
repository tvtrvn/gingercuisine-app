export type DietaryTag = "spicy" | "vegetarian" | "vegan";

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface SizeOption {
  id: string;
  label: string;
  priceDelta: number;
}

export type MenuCategoryId =
  | "pho"
  | "tom-yum"
  | "banh-mi"
  | "rice-plates"
  | "mango-salad"
  | "vermicelli"
  | "appetizers"
  | "specialty-plates"
  | "salmon-fried-fish"
  | "sides"
  | "drinks"
  | "starter-soups"
  | "desserts";

export interface MenuCategory {
  id: MenuCategoryId;
  name: string;
  description?: string;
  /** Shown under the category blurb (e.g. availability disclaimer). */
  availabilityNote?: string;
}

export interface MenuItem {
  id: string;
  categoryId: MenuCategoryId;
  name: string;
  vietnameseName?: string;
  description: string;
  price: number;
  image?: string;
  tags?: DietaryTag[];
  isFeatured?: boolean;
  availableAddons?: AddonOption[];
  availableSizes?: SizeOption[];
  defaultSizeId?: string;
  availableFlavors?: AddonOption[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  price: number;
  unitPrice: number;
  quantity: number;
  notes?: string;
  selectedAddons?: AddonOption[];
  selectedSize?: SizeOption;
  selectedFlavor?: AddonOption;
}

// Payment is in-person only now.
export type PaymentMethod = "pay_in_person";
export type PaymentStatus = "unpaid" | "paid";

export interface PickupDetails {
  name: string;
  phone: string;
  email?: string;
  pickupTimeOption: "asap" | "later";
  pickupTime?: string;
}

// Kitchen/staff workflow statuses.
export type OrderStatus =
  | "new"
  | "acknowledged"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderSource = "website";

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;                       // orderCode (6-char Crockford base32, e.g. K7XD9A)
  createdAt: string;                // ISO string
  updatedAt?: string;
  items: CartItem[];
  pickupDetails: PickupDetails;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  orderStatus: OrderStatus;
  source: OrderSource;

  staffNote?: string;
  viewToken?: string;

  acknowledgedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  totals: OrderTotals;
}

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "new",
  "acknowledged",
  "ready",
  "completed",
  "cancelled",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "new",
  "acknowledged",
  "ready",
];
