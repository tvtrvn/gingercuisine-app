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
}

export type PaymentMethod = "pay_at_pickup" | "stripe";

export interface PickupDetails {
  name: string;
  phone: string;
  email?: string;
  pickupTimeOption: "asap" | "later";
  pickupTime?: string;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  pickupDetails: PickupDetails;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totals: OrderTotals;
}

