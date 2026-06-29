import { AddonOption, MenuCategory, MenuItem, SizeOption } from "@/lib/types";

// add seafood options to all soups
// add curry chicken and curry lamb to all dishes

// ── Image paths ──────────────────────────────────────────────────────
// Central map so you can swap any photo in one place.
// Keys = menu item id, values = path under /public.
const IMG = "/images/Ginger-Food-Photos";
export const MENU_IMAGES: Record<string, string> = {
  // Pho (new PhoGinger-* photos where available)
  "pho-beef":                       `${IMG}/PhoGinger_classic-beef.jpg`,
  "pho-rarebeef-AAA":               `${IMG}/rare-beef-pho-close.jpg`,
  "pho-oxtail-beef-balls":          `${IMG}/PhoGinger-beefball-oxtail.jpg`,
  "pho-chicken":                    `${IMG}/PhoGinger-pho-chicken.jpg`,
  "pho-special":                    `${IMG}/PhoGinger-special-ginger.jpg`,
  "pho-tofu-vegetable":             `${IMG}/tofu-veggie-pho.jpg`,
  "pho-vegan":                      `${IMG}/tofu-veggie-pho.jpg`,
  // Tom Yum
  "tom-yum-seafood":                `${IMG}/seafood-tom-yum.jpg`,
  // Banh Mi
  "banh-mi-chicken":                `${IMG}/chicken-banhmi.jpg`,
  "banh-mi-beef":                   `${IMG}/beef-banhmi.jpg`,
  "banh-mi-grilled-pork":           `${IMG}/pork-banhmi.webp`,
  // Rice Plates
  "rice-grilled-chicken":           `${IMG}/grilled-chicken-rice.jpg`,
  "rice-grilled-pork-chop":         `${IMG}/grilled-porkchop-rice.jpg`,
  "rice-curry-chicken":             `${IMG}/curry-chicken-rice.webp`,
  "rice-curry-lamb":                `${IMG}/curry-lamb-rice.webp`,
  "rice-curry-chicken-beef":        `${IMG}/curry-chicken-beef.jpg`,
  "rice-grilled-beef-ribs":         `${IMG}/PhoGinger-beef-ribs.jpg`,
  "rice-grilled-chicken-pork-chop": `${IMG}/chicken-porkchop-rice.jpg`,
  "rice-grilled-porkchop-and-coconut-shrimp": `${IMG}/PhoGinger-porkchop-coconut-shrimp.jpg`,
  "rice-grilled-chicken-beef-shrimp-roll":    `${IMG}/chicken-beef-shrimp-roll-rice.jpg`,
  // Specialty Plates
  "specialty-chicken-shrimp-pad-thai":       `${IMG}/chicken-shrimp-padthai.jpg`,
  "specialty-chicken-beef-teriyaki-udon":    `${IMG}/chicken-beef-udon.jpg`,
  "specialty-assorted-meat-seafood-mixed-vegetable-with-crispy-noodle": `${IMG}/assorted-noodle.jpg`,
  "specialty-tofu-mixed-vegetable-with-crispy-noodle":                  `${IMG}/tofu-veggie-crispy-noodle.jpg`,
  "specialty-lemongrass-tofu-mixed-vegetable-with-pad-thai":            `${IMG}/lemongrass-tofu-mixed-vegetable-with-pad-thai.webp`,
  "specialty-curry-tofu-mixed-vegetable-eggplant-with-brown-rice":       `${IMG}/PhoGinger-tofu-veg-eggplant.jpg`,
  "specialty-shrimp-fried-rice":     `${IMG}/shrimp-fried-rice.jpg`,
  "specialty-butter-chicken":         `${IMG}/PhoGinger-butter-chicken-naan.jpg`,
  // Salmon & Fried Fish
  "pan-fried-salmon-mango-salad":    `${IMG}/pan-fried-salmon-mango-salad.jpg`,
  "teriyaki-salmon-mixed-vegetable-rice": `${IMG}/salmon-teriyaki.webp`,
  "fried-fish-mango-salad":          `${IMG}/PhoGinger-crispy-fish-rice.jpg`,
  "fish-chips":                      `${IMG}/fish-chips.webp`,
  // Vermicelli
  "vermicelli-grilled-chicken":      `${IMG}/chicken-vermicelli.jpg`,
  "vermicelli-grilled-shrimp":       `${IMG}/shrimp-vermicelli.webp`,
  // Appetizers
  "app-chicken-spring-roll":         `${IMG}/cha-gio-ga.jpg`,
  "app-shrimp-spring-roll":          `${IMG}/shrimp-crispy-roll.webp`,
  "app-chicken-salad-rolls":         `${IMG}/chicken-goi-cuon.webp`,
  "app-shrimp-salad-rolls":          `${IMG}/shrimp-goi-cuon.webp`,
  "app-butter-lime-chicken-wings":   `${IMG}/garlic-butter-lime-wings.jpg`,
  // Starter Soups
  "starter-chicken-coconut-mushroom-soup": `${IMG}/chicken-coco-mushroom-better.webp`,
  "starter-wonton-soup":             `${IMG}/wonton-soup.jpg`,
  // Mango Salad
  "plain-mango-salad":               `${IMG}/plain-mango-salad.jpg`,
  "chicken-shrimp-mango-salad":      `${IMG}/chicken-shrimp-mango.webp`,
  // Drinks
  "drink-iced-coffee":               `${IMG}/cafe-sua-da.jpg`,
  "drink-fruit-smoothie":            `${IMG}/smoothies.jpg`,
  "drink-bubble-tea":                `${IMG}/boba.webp`,
  "drink-soft-drink":                `${IMG}/soft-drinks.jpg`,
  "drink-juice-bottle":              `${IMG}/juice.jpg`,
  "drink-jumex":                     `${IMG}/jumex.webp`,
  "drink-coconut-water":             `${IMG}/coconut-water.avif`,
  // Desserts
  "dessert-cake-slice":              `${IMG}/white-choco-rasb-cheesecake.webp`,
};

/**
 * Pho & Tom Yum extras without the old generic "Meat" add-on. Each dish below
 * adds a protein line that matches what is in the bowl (e.g. Beef for Classic
 * Beef Pho) where applicable.
 */
export const SOUP_ADDONS_BASE: AddonOption[] = [
  { id: "addon-oxtail", name: "Oxtail", price: 8.0 },
  { id: "addon-beef-balls", name: "Beef Balls", price: 6.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
  { id: "addon-tofu", name: "Tofu", price: 5.0 },
  { id: "extra-rice-noodle", name: "Rice noodle", price: 4.0 },
];

/** Base soup add-ons with extra Beef (for selected pho / tom yum). */
export const SOUP_ADDONS_BASE_WITH_BEEF: AddonOption[] = [
  { id: "soup-extra-beef", name: "Beef", price: 7.0 },
  ...SOUP_ADDONS_BASE,
];

/** Classic Beef Pho: same add-ons as base + Beef (replaces old generic "Meat" $7). */
export const SOUP_ADDONS_CLASSIC_BEEF_PHO: AddonOption[] =
  SOUP_ADDONS_BASE_WITH_BEEF;

/**
 * Ginger Special pho: extras matching proteins in the bowl (no generic "Meat").
 */
export const SOUP_ADDONS_GINGER_SPECIAL_PHO: AddonOption[] = [
  { id: "soup-extra-beef", name: "Beef", price: 7.0 },
  { id: "addon-oxtail", name: "Oxtail", price: 8.0 },
  { id: "addon-beef-balls", name: "Beef Balls", price: 6.0 },
  { id: "soup-extra-chicken", name: "Chicken", price: 7.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
  { id: "addon-tofu", name: "Tofu", price: 5.0 },
  { id: "extra-rice-noodle", name: "Rice noodle", price: 4.0 },
];

/** Chicken Pho and Tom Yum Chicken: extra Chicken, Beef, then shared base. */
export const SOUP_ADDONS_CHICKEN_SOUP: AddonOption[] = [
  { id: "soup-extra-chicken", name: "Chicken", price: 7.0 },
  { id: "soup-extra-beef", name: "Beef", price: 7.0 },
  ...SOUP_ADDONS_BASE,
];

/** Pho / Tom Yum Vegan: plant add-ons only (no generic "Meat"). */
export const SOUP_ADDONS_VEGAN_SOUP: AddonOption[] = [
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
  { id: "addon-tofu", name: "Tofu", price: 5.0 },
  { id: "extra-rice-noodle", name: "Rice noodle", price: 4.0 },
];

/** Tom Yum / soup seafood extras (also merged into Tom Yum Seafood). */
export const SOUP_ADDONS_SEAFOOD: AddonOption[] = [
  { id: "shrimp", name: "Shrimp", price: 8.0 },
  { id: "squid", name: "Squid", price: 8.0 },
  { id: "mussels", name: "Mussels", price: 8.0 },
  { id: "crab-meat", name: "Crab Meat", price: 8.0 },
];

/** Tom Yum Seafood: extra Beef, base, then each seafood add-on. */
export const TOM_YUM_SEAFOOD_ADDONS: AddonOption[] = [
  { id: "soup-extra-beef", name: "Beef", price: 7.0 },
  ...SOUP_ADDONS_BASE,
  ...SOUP_ADDONS_SEAFOOD,
];

/** Shown on starter soups (small soups) as an optional add-on. */
export const STARTER_SOUP_ADDONS: AddonOption[] = [
  { id: "extra-rice-noodle", name: "Rice noodle", price: 4.0 },
];

/** Protein choice for Coconut Mushroom Soup. Chicken first = default. */
export const COCONUT_SOUP_PROTEIN: AddonOption[] = [
  { id: "coconut-soup-chicken", name: "Chicken", price: 0.0 },
  { id: "coconut-soup-tofu", name: "Tofu", price: 0.0 },
];

/**
 * Extra meat & protein: used on the Sides menu and as add-ons for rice
 * plates, specialty plates, and vermicelli. Pick a specific item — no general
 * “meat” bucket. Shrimp is included; mussels/squid/crab (soup seafood) are
 * not offered here. Tofu is split into white vs fried.
 */
export const MEAT_PROTEIN_ADDONS = [
  { id: "extra-grilled-chicken", name: "Grilled chicken", price: 7.0 },
  { id: "extra-grilled-beef", name: "Grilled beef", price: 7.0 },
  { id: "extra-grilled-porkchop", name: "Grilled pork chop", price: 7.0 },
  { id: "extra-grilled-pork", name: "Grilled pork", price: 7.0 },
  { id: "extra-rice-noodle", name: "Rice noodle", price: 4.0 },
  { id: "extra-curry-chicken", name: "Curry chicken", price: 6.0 },
  { id: "extra-curry-lamb", name: "Curry lamb", price: 8.0 },
  { id: "extra-shrimp", name: "Shrimp", price: 8.0 },
  { id: "extra-beef-balls", name: "Beef balls", price: 6.0 },
  { id: "extra-oxtail", name: "Oxtail", price: 8.0 },
  { id: "extra-tofu-white", name: "Tofu (white)", price: 5.0 },
  { id: "extra-tofu-fried", name: "Tofu (fried)", price: 5.0 },
];

/**
 * How to append non-meat extras: `rice` set is egg + vegetable plus dish-specific meats;
 * base grain switching is modeled via [`RICE_PLATE_BASE_OPTIONS`] (not addon `switch-fried-rice`).
 * `specialty` includes "Fried rice" $5; `vermicelli` omits any rice swap.
 */
export type DishNonMeatSet =
  | "rice"
  | "specialty"
  | "vermicelli"
  /** Extra shrimp only: egg + vegetable (no grain, no fried-rice add-on). */
  | "egg-veg-only";

/** Non-meat extras for most specialty plates — “Fried rice” $5, no grain. */
export const NON_MEAT_DISH_ADDONS: AddonOption[] = [
  { id: "addon-egg", name: "Egg", price: 2.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
  { id: "fried-rice", name: "Fried rice", price: 5.0 },
];

const NON_MEAT_RICE_ADDONS: AddonOption[] = [
  { id: "addon-egg", name: "Egg", price: 2.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
];

const NON_MEAT_VERMICELLI_ADDONS: AddonOption[] = [
  { id: "addon-egg", name: "Egg", price: 2.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
  {
    id: "addon-vermicelli-noodle",
    name: "Vermicelli noodle",
    price: 4.0,
  },
];

const NON_MEAT_EGG_VEG_ONLY: AddonOption[] = [
  { id: "addon-egg", name: "Egg", price: 2.0 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.0 },
];

/**
 * Mutually-exclusive base choice for rice plates and select specialty plates.
 * Fried Rice is the only paid upgrade ($1).
 *
 * NOTE: Addon id `"fried-rice"` exists separately in NON_MEAT_DISH_ADDONS (“Fried rice” $5);
 * sizes and addons live in separate namespaces; these ids use a `base-` prefix for clarity.
 */
export const RICE_PLATE_BASE_OPTIONS: SizeOption[] = [
  { id: "base-white-rice", label: "White Rice", priceDelta: 0 },
  { id: "base-brown-rice", label: "Brown Rice", priceDelta: 1.0 },
  { id: "base-mixed-vegetables", label: "Mixed Vegetables", priceDelta: 0 },
  { id: "base-pad-thai", label: "Pad Thai", priceDelta: 1.0 },
  { id: "base-udon", label: "Udon", priceDelta: 1.0 },
  { id: "base-vermicelli", label: "Vermicelli", priceDelta: 0 },
  { id: "base-fried-rice", label: "Fried Rice", priceDelta: 1.0 },
];

export const BUTTER_CHICKEN_BASE_OPTIONS: SizeOption[] = [
  { id: "rice", label: "Rice", priceDelta: 0 },
  { id: "naan", label: "Naan", priceDelta: 0 },
];

export const BUTTER_CHICKEN_ADDONS: AddonOption[] = [
  { id: "extra-rice", name: "Extra rice", price: 4.0 },
  { id: "extra-naan", name: "Extra naan", price: 4.0 },
];

function nonMeatAddonsFor(set: DishNonMeatSet): AddonOption[] {
  if (set === "rice") return NON_MEAT_RICE_ADDONS;
  if (set === "vermicelli") return NON_MEAT_VERMICELLI_ADDONS;
  if (set === "egg-veg-only") return NON_MEAT_EGG_VEG_ONLY;
  return NON_MEAT_DISH_ADDONS;
}

/**
 * Build the add-on list for a dish. Pass the add-on IDs of the proteins
 * actually in the dish. Non-meat set: `rice` adds egg + vegetable (grain swap is handled in
 * [`RICE_PLATE_BASE_OPTIONS`]), `specialty`
 * (Fried rice $5), `vermicelli` (Vermicelli noodle $4), `egg-veg-only`
 * (egg + vegetable only — e.g. shrimp fried rice).
 */
export function dishAddonsFor(
  meatAddonIds: string[],
  set: DishNonMeatSet = "specialty",
): AddonOption[] {
  const meats = MEAT_PROTEIN_ADDONS.filter((a) =>
    meatAddonIds.includes(a.id),
  );
  if (meats.length !== meatAddonIds.length) {
    const missing = meatAddonIds.filter(
      (id) => !MEAT_PROTEIN_ADDONS.some((a) => a.id === id),
    );
    throw new Error(
      `dishAddonsFor: unknown meat add-on id(s): ${missing.join(", ")}`,
    );
  }
  return [...meats, ...nonMeatAddonsFor(set)];
}

export const SMOOTHIE_FLAVORS = [
  { id: "strawberry", name: "Strawberry", price: 0.0 },
  { id: "banana", name: "Banana", price: 0.0 },
  { id: "mango", name: "Mango", price: 0.0 },
  { id: "pineapple", name: "Pineapple", price: 0.0 },
  { id: "avocado", name: "Avocado", price: 0.0 },
];

export const HOT_TEA_FLAVORS = [
  { id: "black-tea", name: "Black tea", price: 0.0 },
  { id: "jasmine-green-tea", name: "Jasmine green tea", price: 0.0 },
];

/** Canned soft drink choices (same list price; staff swap brand at the counter). */
export const SOFT_DRINK_FLAVORS = [
  { id: "coke", name: "Coke", price: 0.0 },
  { id: "coke-zero", name: "Coke Zero", price: 0.0 },
  { id: "diet-coke", name: "Diet Coke", price: 0.0 },
  { id: "pepsi", name: "Pepsi", price: 0.0 },
  { id: "diet-pepsi", name: "Diet Pepsi", price: 0.0 },
  { id: "fuze", name: "Fuze", price: 0.0 },
  { id: "root-beer", name: "Root beer", price: 0.0 },
  { id: "ginger-ale", name: "Ginger ale", price: 0.0 },
  { id: "crush-grape", name: "Crush (grape)", price: 0.0 },
  { id: "crush-orange", name: "Crush (orange)", price: 0.0 },
  { id: "crush-cream-soda", name: "Crush (cream soda)", price: 0.0 },
];

export const BUBBLE_TEA_FLAVORS = [
  { id: "bbt-mango", name: "Mango", price: 0.0 },
  { id: "bbt-strawberry", name: "Strawberry", price: 0.0 },
  { id: "bbt-original", name: "Original", price: 0.0 },
  { id: "bbt-lychee", name: "Lychee", price: 0.0 },
  { id: "bbt-peach", name: "Peach", price: 0.0 },
  { id: "bbt-honeydew", name: "Honeydew", price: 0.0 },
  { id: "bbt-passion-fruit", name: "Passion fruit", price: 0.0 },
  { id: "bbt-taro", name: "Taro", price: 0.0 },
];

/** Side add-on: soup size + broth (replaces separate small/large line items). */
export const SIDE_SOUP_SIZE_OPTIONS = [
  { id: "small", label: "Small", priceDelta: 0 },
  { id: "large", label: "Large", priceDelta: 1 },
];

export const SIDE_SOUP_BROTH_FLAVORS = [
  { id: "pho-broth", name: "Pho broth", price: 0.0 },
  { id: "tom-yum-broth", name: "Tom yum broth", price: 0.0 },
  { id: "chicken-broth", name: "Chicken broth", price: 0.0 },
  { id: "vegetable-broth", name: "Vegetable broth", price: 0.0 },
];

export const COCONUT_WATER_SIZE_OPTIONS: SizeOption[] = [
  { id: "small", label: "Small", priceDelta: 0 },
  { id: "large", label: "Large", priceDelta: 1.0 },
];

export const JUICE_BOTTLE_FLAVORS = [
  { id: "orange-juice", name: "Orange juice", price: 0.0 },
  { id: "apple-juice", name: "Apple juice", price: 0.0 },
];

export const JUMEX_FLAVORS = [
  { id: "mango", name: "Mango", price: 0.0 },
  { id: "strawnana", name: "Strawnana", price: 0.0 },
  { id: "guanabana", name: "Guanabana", price: 0.0 },
  { id: "pineapple-nectar", name: "Pineapple nectar", price: 0.0 },
  { id: "strawberry", name: "Strawberry", price: 0.0 },
  { id: "guava", name: "Guava", price: 0.0 },
];

/**
 * The Cheesecake Factory slice options. Base price is for standard slices;
 * some varieties add a small upcharge.
 */
export const DESSERT_CAKE_FLAVORS = [
  {
    id: "wild-strawberries-cream",
    name: "Wild strawberries & cream cheesecake",
    price: 0.0,
  },
  {
    id: "godiva-double-chocolate",
    name: "Godiva double chocolate cheesecake",
    price: 0.51,
  },
  {
    id: "white-chocolate-raspberry",
    name: "White chocolate raspberry cheesecake",
    price: 0.0,
  },
  {
    id: "mango-key-lime",
    name: "Mango key lime cheesecake",
    price: 0.51,
  },
  { id: "red-velvet", name: "Red velvet cheesecake", price: 0.0 },
];

export const SOUP_SIZE_OPTIONS = [
  { id: "small", label: "Small", priceDelta: 0 },
  { id: "large", label: "Large", priceDelta: 2 },
];

/** Classic Beef Pho: how the customer wants the beef in the bowl (same list price). */
export const CLASSIC_BEEF_PHO_CUTS: AddonOption[] = [
  { id: "pho-beef-rare", name: "Rare beef", price: 0.0 },
  { id: "pho-beef-well-done", name: "Well-done beef", price: 0.0 },
  { id: "pho-beef-both", name: "Both (rare & well-done)", price: 0.0 },
];

/** Chicken Pho & Tom Yum Chicken: grilled vs steamed (same list price). */
export const CHICKEN_PHO_STYLE: AddonOption[] = [
  { id: "pho-chicken-grilled", name: "Grilled chicken", price: 0.0 },
  { id: "pho-chicken-steamed", name: "Steamed chicken", price: 0.0 },
];

export const LARGE_ONLY_SIZE_OPTION = [
  { id: "large", label: "Large", priceDelta: 1.45 }, //seafood and õxtail price delta 2$ total for Large
];

export const LARGE_ONLY_SIZE_OPTION_SEAFOOD_AND_OXT_PRICE_DELTA = [
  { id: "large", label: "Large", priceDelta: 2 }, //seafood and õxtail price delta 2$ total for Large
];

export const menuCategories: MenuCategory[] = [
  {
    id: "pho",
    name: "Pho (Rice Noodle Soups)",
    description: "Slow-simmered beef broth with delicate rice noodles and topped with onions, saw leaf, basil, beansprout and lime.",
  },
  {
    id: "tom-yum",
    name: "Tom Yum (Hot & Sour Soup)",
    description: "Hot and sour soup with delicate rice noodles and topped with onions, saw leaf, basil, beansprout and lime.",
  },
  {
    id: "mango-salad",
    name: "Mango Salad",
    description: "Fresh mango with fish sauce, mint, onions, cilantro and lime.",
  },
  {
    id: "banh-mi",
    name: "Bánh Mì (Vietnamese Sandwiches)",
    description: "Crispy baguettes with house-made pickled carrots, daikon, cucumber, tomatoes and cilantro.",
  },
  {
    id: "rice-plates",
    name: "Rice Plates",
    description: "Fragrant jasmine rice with grilled specialties topped with bokchoy.",
  },
  {
    id: "specialty-plates",
    name: "Specialty Plates",
    description: "House specialties — pad thai, udon, and crispy noodles.",
  },
  {
    id: "salmon-fried-fish",
    name: "Salmon & Fried Fish",
    description: "Salmon & fried fish plates.",
  },
  {
    id: "vermicelli",
    name: "Vermicelli Bowls",
    description: "Cool rice noodles with fresh herbs and sauce.",
  },
  {
    id: "appetizers",
    name: "Appetizers",
    description: "Perfect to share or start your meal.",
  },
  {
    id: "starter-soups",
    name: "Starter Soups",
    description: "Light, flavorful soups to begin your meal.",
  },
  {
    id: "sides",
    name: "Sides",
    description: "Extra side add-ons.",
  },
  {
    id: "drinks",
    name: "Drinks",
    description: "Vietnamese coffee, teas, smoothies, bubble tea, and soft drinks.",
    availabilityNote: "Options can change based on availability.",
  },
  {
    id: "desserts",
    name: "Desserts",
    description: "Slices of cake, specially ordered from The Cheesecake Factory",
    availabilityNote: "Options can change based on availability.",
  },
];

export const menuItems: MenuItem[] = ([
  // Pho
  {
    id: "pho-beef",
    categoryId: "pho",
    name: "Classic Beef Pho",
    vietnameseName: "Phở Bò",
    description:
      "Rice noodles in aromatic beef broth — choose rare beef, well-done beef, or both — topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    isFeatured: true,
    availableFlavors: CLASSIC_BEEF_PHO_CUTS,
    availableAddons: SOUP_ADDONS_CLASSIC_BEEF_PHO,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "pho-rarebeef-AAA",
    categoryId: "pho",
    name: "Rare Beef AAA Grade Pho (L)",
    vietnameseName: "Phở Bò Tái AAA (L)",
    description:
      "Rice noodles in aromatic beef broth with AAA grade rare beef, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 20.95,
    tags: [],
    availableAddons: SOUP_ADDONS_BASE,
    availableSizes: LARGE_ONLY_SIZE_OPTION,
    defaultSizeId: "large",
  },
  {
    id: "pho-oxtail-beef-balls",
    categoryId: "pho",
    name: "Oxtail & Beef Balls Pho",
    vietnameseName: "Phở Đuôi Bò & Bò Viên",
    description:
      "Rice noodles in aromatic beef broth with oxtail and beef balls, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 16.95,
    tags: [],
    availableAddons: SOUP_ADDONS_BASE_WITH_BEEF,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "pho-special",
    categoryId: "pho",
    name: "Ginger Special Pho (L)",
    vietnameseName: "Phở Đặc Biệt",
    description:
      "Signature pho with rare beef, brisket, oxtail, chicken, and beef balls in rich broth topped with onions, saw leaf, basil, beansprout and lime.",
    price: 19.95,
    tags: [],
    isFeatured: true,
    availableAddons: SOUP_ADDONS_GINGER_SPECIAL_PHO,
  },
  {
    id: "pho-chicken",
    categoryId: "pho",
    name: "Chicken Pho",
    vietnameseName: "Phở Gà",
    description:
      "Rice noodles in aromatic beef broth — choose grilled or steamed chicken — topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableFlavors: CHICKEN_PHO_STYLE,
    availableAddons: SOUP_ADDONS_CHICKEN_SOUP,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "pho-tofu-vegetable",
    categoryId: "pho",
    name: "Tofu & Vegetable Pho",
    vietnameseName: "Phở Rau Cải & Đậu Hũ",
    description:
    "Rice noodles in aromatic beef broth with tofu and mixed vegetables, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableAddons: SOUP_ADDONS_BASE_WITH_BEEF,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "pho-vegan",
    categoryId: "pho",
    name: "Vegan Pho",
    vietnameseName: "Phở Chay",
    description:
      "Rice noodles in aromatic vegetable broth with tofu and mixed vegetables, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: ["vegetarian", "vegan"],
    availableAddons: SOUP_ADDONS_VEGAN_SOUP,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  // Tom Yum
  {
    id: "tom-yum-seafood",
    categoryId: "tom-yum",
    name: "Tom Yum Seafood",
    vietnameseName: "Tom Yum Hải Sản",
    description:
      "Rice noodles in aromatic hot and sour broth with shrimp, squid, clams, and mushrooms, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 16.95,
    tags: [],
    availableAddons: TOM_YUM_SEAFOOD_ADDONS,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "tom-yum-chicken",
    categoryId: "tom-yum",
    name: "Tom Yum Chicken",
    vietnameseName: "Tom Yum Gà",
    description:
      "Rice noodles in aromatic hot and sour broth — choose grilled or steamed chicken — topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableFlavors: CHICKEN_PHO_STYLE,
    availableAddons: SOUP_ADDONS_CHICKEN_SOUP,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "tom-yum-tofu-vegetable",
    categoryId: "tom-yum",
    name: "Tom Yum Tofu & Vegetable",
    vietnameseName: "Tom Yum Đậu Hũ & Rau Cải",
    description:
      "Rice noodles in aromatic hot and sour broth with tofu and mixed vegetables, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableAddons: SOUP_ADDONS_BASE_WITH_BEEF,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "tom-yum-vegan",
    categoryId: "tom-yum",
    name: "Tom Yum Vegan",
    vietnameseName: "Tom Yum Chay",
    description:
      "Rice noodles in aromatic vegetable hot and sour broth with tofu and mixed vegetables, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: ["vegetarian", "vegan"],
    availableAddons: SOUP_ADDONS_VEGAN_SOUP,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },

  // Banh Mi
  {
    id: "banh-mi-chicken",
    categoryId: "banh-mi",
    name: "Grilled Chicken Bánh Mì",
    vietnameseName: "Bánh Mì Thịt Gà Nướng",
    description:
      "Grilled chicken with homemade mayonnaise, soy sauce, pickled carrots, daikon, cucumber, tomatoes and cilantro.",
    price: 8.95,
    tags: [],
    isFeatured: true,
  },
  {
    id: "banh-mi-beef",
    categoryId: "banh-mi",
    name: "Grilled Beef Bánh Mì",
    vietnameseName: "Bánh Mì Thịt Bò Nướng",
    description:
      "Grilled beef with homemade mayonnaise, soy sauce, pickled carrots, daikon, cucumber, tomatoes and cilantro.",
    price: 8.95,
    tags: [],
  },
  {
    id: "banh-mi-grilled-pork",
    categoryId: "banh-mi",
    name: "Grilled Pork Bánh Mì",
    vietnameseName: "Bánh Mì Thịt Heo Nướng",
    description:
      "Chargrilled pork with homemade mayonnaise, soy sauce, pickled carrots, daikon, cucumber, tomatoes and cilantro.",
    price: 8.95,
    tags: [],
  },
  {
    id: "banh-mi-tofu",
    categoryId: "banh-mi",
    name: "Crispy Tofu Bánh Mì",
    vietnameseName: "Bánh Mì Đậu Hũ Sả",
    description:
      "Crispy lemongrass tofu with homemade mayonnaise, soy sauce, pickled carrots, daikon, cucumber, tomatoes and cilantro.",
    price: 8.95,
    tags: ["vegetarian"],
  },
  {
    id: "banh-mi-pork-belly",
    categoryId: "banh-mi",
    name: "Slow Cooked Pork Belly Bánh Mì",
    vietnameseName: "Bánh Mì Thịt Ba Rọi",
    description:
      "Slow cooked pork belly with homemade mayonnaise, soy sauce, pickled carrots, daikon, cucumber, tomatoes and cilantro.",
    price: 8.95,
    tags: [],
  },

  // Rice plates
  {
    id: "rice-grilled-pork-chop",
    categoryId: "rice-plates",
    name: "Grilled Pork Chop Rice Plate",
    vietnameseName: "Cơm Sườn Nướng",
    description:
      "Marinated pork chop over jasmine rice, bokchoy, and fish sauce.",
    price: 17.5,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-grilled-porkchop"], "rice"),
  },
  {
    id: "rice-grilled-chicken",
    categoryId: "rice-plates",
    name: "Grilled Chicken Rice Plate",
    vietnameseName: "Cơm Gà Nướng",
    description:
      "Grilled chicken with jasmine rice and bokchoy.",
    price: 16.25,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-grilled-chicken"], "rice"),
  },
  {
    id: "rice-spicy-grilled-chicken",
    categoryId: "rice-plates",
    name: "Spicy Grilled Chicken Rice Plate",
    vietnameseName: "Cơm Gà Nướng Xốt Cay",
    description:
      "Spicy grilled chicken with jasmine rice and bokchoy.",
    price: 16.25,
    tags: ["spicy"],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-grilled-chicken"], "rice"),
  },
  {
    id: "rice-lemon-grass-beef",
    categoryId: "rice-plates",
    name: "Lemongrass Beef Rice Plate",
    vietnameseName: "Cơm Bò Nướng Sả",
    description:
      "Grilled lemongrass beef with jasmine rice and bokchoy.",
    price: 16.25,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-grilled-beef"], "rice"),
  },
  {
    id: "rice-curry-chicken",
    categoryId: "rice-plates",
    name: "Curry Chicken Rice Plate",
    vietnameseName: "Cơm Cà ri Gà",
    description:
      "Curry chicken with jasmine rice and bokchoy.",
    price: 16.25,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-curry-chicken"], "rice"),
  },
  {
    id: "rice-grilled-beef-ribs",
    categoryId: "rice-plates",
    name: "Grilled Beef Ribs Rice Plate",
    vietnameseName: "Cơm Sườn Bò Nướng",
    description:
      "Grilled beef ribs with jasmine rice and bokchoy.",
    price: 17.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor([], "rice"),
  },
  {
    id: "rice-grilled-porkchop-and-coconut-shrimp",
    categoryId: "rice-plates",
    name: "Grilled Pork Chop & Coconut Shrimp Rice Plate",
    vietnameseName: "Cơm Sườn & Tôm Rim Nước Dưa",
    description:
      "Grilled pork chop and coconut shrimp with jasmine rice and bokchoy.",
    price: 17.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-shrimp"], "rice"),
  },
  {
    id: "rice-grilled-chicken-pork-chop",
    categoryId: "rice-plates",
    name: "Grilled Chicken & Pork Chop Rice Plate",
    vietnameseName: "Cơm Gà & Sườn Nướng",
    description:
      "Grilled chicken & pork chop with jasmine rice, bokchoy, and fish sauce.",
    price: 17.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(
      [
        "extra-grilled-chicken",
        "extra-grilled-porkchop",
      ],
      "rice",
    ),
  },
  {
    id: "rice-curry-lamb",
    categoryId: "rice-plates",
    name: "Curry Lamb Rice Plate",
    vietnameseName: "Cơm Cà ri Dê",
    description:
      "Curry lamb with jasmine rice and bokchoy.",
    price: 19.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(["extra-curry-lamb"], "rice"),
  },
  {
    id: "rice-curry-chicken-beef",
    categoryId: "rice-plates",
    name: "Curry Chicken & Beef Rice Plate",
    vietnameseName: "Cơm Cà ri Gà & Bò",
    description:
      "Curry chicken & beef with jasmine rice and bokchoy.",
    price: 17.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(
      [
        "extra-curry-chicken",
        "extra-grilled-beef",
      ],
      "rice",
    ),
  },
  {
    id: "rice-grilled-chicken-beef-shrimp-roll",
    categoryId: "rice-plates",
    name: "Grilled Chicken & Beef & Shrimp & Spring Roll Rice Plate",
    vietnameseName: "Cơm Thập cẩm",
    description:
      "Grilled chicken & beef & shrimp & crispy chicken spring roll with fish sauce and jasmine rice and bokchoy.",
    price: 18.95,
    tags: [],
    isFeatured: true,
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-white-rice",
    availableAddons: dishAddonsFor(
      [
        "extra-grilled-chicken",
        "extra-grilled-beef",
        "extra-shrimp",
      ],
      "rice",
    ),
  },
  // Specialty Plates
  {
    id: "specialty-chicken-shrimp-pad-thai",
    categoryId: "specialty-plates",
    name: "Chicken & Shrimp Pad Thai Specialty Plate",
    vietnameseName: "Pad Thai Gà & Tôm",
    description:
      "Grilled chicken & shrimp pad thai with cabbage.",
    price: 18.95,
    tags: [],
    isFeatured: true,
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-pad-thai",
    availableAddons: dishAddonsFor(
      [
        "extra-grilled-chicken",
        "extra-shrimp",
      ],
      "rice",
    ),
  },
  {
    id: "specialty-chicken-beef-teriyaki-udon",
    categoryId: "specialty-plates",
    name: "Chicken & Beef Teriyaki Udon Specialty Plate",
    vietnameseName: "Udon Gà & Bò Teriyaki",
    description:
      "Grilled chicken & beef teriyaki udon with cabbage.",
    price: 18.95,
    tags: [],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-udon",
    availableAddons: dishAddonsFor(
      [
        "extra-grilled-chicken",
        "extra-grilled-beef",
      ],
      "rice",
    ),
  },
  {
    id: "specialty-assorted-meat-seafood-mixed-vegetable-with-crispy-noodle",
    categoryId: "specialty-plates",
    name: "Assorted Meat, Seafood, Mixed Vegetable with Crispy Noodle Specialty Plate",
    vietnameseName: "Mì Xào Giòn Thập Cẩm",
    description:
      "Assorted grilled meat, seafood, mixed vegetable with crispy noodle.",
    price: 18.95,
    tags: [],
  },
  {
    id: "specialty-tofu-mixed-vegetable-with-crispy-noodle",
    categoryId: "specialty-plates",
    name: "Tofu & Mixed Vegetable with Crispy Noodle Specialty Plate",
    vietnameseName: "Mì Xào Giòn Đậu Hũ & Rau Cải",
    description:
      "Tofu & mixed vegetable with crispy noodle.",
    price: 16.5,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "specialty-lemongrass-tofu-mixed-vegetable-with-pad-thai",
    categoryId: "specialty-plates",
    name: "Lemongrass Tofu & Mixed Vegetable with Pad Thai Specialty Plate",
    vietnameseName: "Đậu Hũ Sả & Rau Cải Pad Thai",
    description:
      "Lemon grass tofu & mixed vegetable with pad thai.",
    price: 19.5,
    tags: ["vegetarian", "vegan"],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-pad-thai",
    availableAddons: dishAddonsFor(["extra-tofu-fried"], "rice"),
  },
  {
    id: "specialty-curry-tofu-mixed-vegetable-eggplant-with-brown-rice",
    categoryId: "specialty-plates",
    name: "Curry Tofu & Mixed Vegetable & Eggplant with Brown Rice Specialty Plate",
    vietnameseName: "Cà ri Đậu Hũ & Rau Cải & Cà tím & Cơm gạo lứt",
    description:
      "Curry tofu & mixed vegetable & eggplant with brown rice.",
    price: 16.5,
    tags: ["vegetarian", "vegan"],
    availableSizes: RICE_PLATE_BASE_OPTIONS,
    defaultSizeId: "base-brown-rice",
    availableAddons: dishAddonsFor(["extra-tofu-fried"], "rice"),
  },
  {
    id: "specialty-shrimp-fried-rice",
    categoryId: "specialty-plates",
    name: "Shrimp Fried Rice Specialty Plate",
    vietnameseName: "Com Chien Tôm",
    description:
      "Grilled shrimp fried rice with vegetables medley and eggs.",
    price: 18.95,
    tags: [],
    availableAddons: dishAddonsFor(["extra-shrimp"], "egg-veg-only"),
  },
  {
    id: "specialty-butter-chicken",
    categoryId: "specialty-plates",
    name: "Butter Chicken Specialty Plate",
    vietnameseName: "Butter Chicken",
    description:
      "Butter chicken with your choice of jasmine rice or naan.",
    price: 18.95,
    tags: [],
    availableSizes: BUTTER_CHICKEN_BASE_OPTIONS,
    defaultSizeId: "rice",
    availableAddons: BUTTER_CHICKEN_ADDONS,
  },
  // Salmon & Fried Fish
  {
    id: "pan-fried-salmon-mango-salad",
    categoryId: "salmon-fried-fish",
    name: "Pan Fried Salmon & Mango Salad Plate",
    vietnameseName: "Cá Salmon & Gỏi Xoài",
    description:
      "Pan fried salmon & mango salad with jasmine rice, bokchoy, and fish sauce.",
    price: 21.95,
    tags: [],
  },
  {
    id: "teriyaki-salmon-mixed-vegetable-rice",
    categoryId: "salmon-fried-fish",
    name: "Teriyaki Salmon & Mixed Vegetable Rice Plate",
    vietnameseName: "Cá Salmon Teriyaki & Rau Cải",
    description:
      "Teriyaki salmon & mixed vegetable with jasmine rice and bokchoy.",
    price: 21.95,
    tags: [],
  },
  {
    id: "fried-fish-mango-salad",
    categoryId: "salmon-fried-fish",
    name: "Fried Fish & Mango Salad Plate",
    vietnameseName: "Cá Chiên & Gỏi Xoài",
    description:
      "Golden fried fish & mango salad with jasmine rice, bokchoy, and fish sauce.",
    price: 18.95,
    tags: [],
  },
  {
    id: "fish-chips",
    categoryId: "salmon-fried-fish",
    name: "Fish Chips Plate",
    vietnameseName: "Cá Chiên Khoai Lang",
    description:
      "Golden fried fish with sweet potato fries and mixed mayonnaise.",
    price: 15.95,
    tags: [],
  },
  
  // Vermicelli
  {
    id: "vermicelli-grilled-chicken",
    categoryId: "vermicelli",
    name: "Grilled Chicken Vermicelli Bowl",
    vietnameseName: "Bún Gà Nướng Chả Giò",
    description:
    "Cool rice vermicelli with grilled chicken, crispy chicken spring roll, served with onion, peanuts, pickled carrot, beansprout, lettuce, cucumber, mint and fish sauce.",
    price: 17.75,
    tags: [],
    isFeatured: true,
    availableAddons: dishAddonsFor(["extra-grilled-chicken"], "vermicelli"),
  },
  {
    id: "vermicelli-grilled-beef",
    categoryId: "vermicelli",
    name: "Grilled Beef & Spring Roll Vermicelli",
    vietnameseName: "Bún Bò Nướng Chả Giò",
    description:
    "Cool rice vermicelli with grilled beef, crispy chicken spring roll, served with onion, peanuts, pickled carrot, beansprout, lettuce, cucumber, mint and fish sauce.",
    price: 17.75,
    tags: [],
    availableAddons: dishAddonsFor(["extra-grilled-beef"], "vermicelli"),
  },
  {
    id: "vermicelli-grilled-pork",
    categoryId: "vermicelli",
    name: "Grilled Pork & Spring Roll Vermicelli",
    vietnameseName: "Bún Thịt Heo Nướng Chả Giò",
    description:
    "Cool rice vermicelli with grilled pork, crispy chicken spring roll, served with onion, peanuts, pickled carrot, beansprout, lettuce, cucumber, mint and fish sauce.",
    price: 17.75,
    tags: [],
    availableAddons: dishAddonsFor(["extra-grilled-pork"], "vermicelli"),
  },
  {
    id: "vermicelli-grilled-shrimp",
    categoryId: "vermicelli",
    name: "Grilled Shrimp & Spring Roll Vermicelli",
    vietnameseName: "Bún Tôm Nướng Chả Giò",
    description:
    "Cool rice vermicelli with grilled shrimp, crispy chicken spring roll, served with onion, peanuts, pickled carrot, beansprout, lettuce, cucumber, mint and fish sauce.",
    price: 17.75,
    tags: [],
    availableAddons: dishAddonsFor(["extra-shrimp"], "vermicelli"),
  },
  {
    id: "vermicelli-tofu",
    categoryId: "vermicelli",
    name: "Tofu & Spring Roll Vermicelli",
    vietnameseName: "Bún Đậu Hũ Sả Chả Giò",
    description:
    "Cool rice vermicelli with lemongrass tofu, crispy vegetable spring roll, served with onion, peanuts, pickled carrot, beansprout, lettuce, cucumber, mint and soy sauce.",
    price: 17.75,
    tags: ["vegetarian", "vegan"],
    availableAddons: dishAddonsFor(["extra-tofu-fried"], "vermicelli"),
  },

  // Appetizers
  {
    id: "app-chicken-spring-roll",
    categoryId: "appetizers",
    name: "Crispy Chicken Spring Roll (1)",
    vietnameseName: "Chả Giò Gà",
    description:
      "Golden-fried rice paper roll stuffed with chicken, veggies, and vermicelli, served with fish sauce.",
    price: 2.95,
    tags: [],
  },
  {
    id: "app-shrimp-spring-roll",
    categoryId: "appetizers",
    name: "Crispy Shrimp Spring Roll (1)",
    vietnameseName: "Chả Giò Tôm",
    description:
      "Golden-fried wonton paper roll stuffed with shrimp and veggies served with fish sauce.",
    price: 2.95,
    tags: [],
  },
  {
    id: "app-vegetable-spring-roll",
    categoryId: "appetizers",
    name: "Crispy Vegetable Spring Roll (1)",
    vietnameseName: "Chả Giò Chay",
    description:
      "Golden-fried rice paper roll stuffed with mixed vegetables and vermicelli, served with soy sauce.",
    price: 2.95,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "app-chicken-salad-rolls",
    categoryId: "appetizers",
    name: "Chicken Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Gà",
    description:
      "Rice paper roll stuffed with steamedchicken, herbs, and vermicelli, served with hoisin sauce.",
    price: 3.50,
    tags: [],
  },
  {
    id: "app-shrimp-salad-rolls",
    categoryId: "appetizers",
    name: "Shrimp Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Tôm",
    description:
      "Rice paper roll stuffed with steamed shrimp, herbs, and vermicelli, served with hoisin sauce.",
    price: 3.50,
    tags: [],
  },
  {
    id: "app-crab-avocado-salad-rolls",
    categoryId: "appetizers",
    name: "Crab Avocado Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Cua Bơ",
    description:
      "Rice paper roll stuffed with imitation crab, avocado, herbs, and vermicelli, served with hoisin sauce.",
    price: 3.50,
    tags: [],
  },
  {
    id: "app-tofu-avocado-salad-rolls",
    categoryId: "appetizers",
    name: "Tofu Avocado Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Đậu Hũ Bơ",
    description:
      "Rice paper roll stuffed with fried tofu, avocado, herbs, and vermicelli, served with soy sauce.",
    price: 3.50,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "app-jicama-salad-rolls",
    categoryId: "appetizers",
    name: "Jicama Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Củ Sắn",
    description:
      "Rice paper roll stuffed with jicama, herbs, and vermicelli, served with soy sauce.",
    price: 3.50,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "app-yam-avocado-salad-rolls",
    categoryId: "appetizers",
    name: "Yam Avocado Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Khoai Lang Bơ",
    description:
      "Rice paper roll stuffed with sweet potato, coconut sauce,avocado, herbs, and vermicelli, served with soy sauce.",
    price: 3.50,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "app-grilled-beef-salad-rolls",
    categoryId: "appetizers",
    name: "Grilled Beef Salad Roll (1)",
    vietnameseName: "Gỏi Cuốn Thịt Bò Nướng",
    description:
      "Rice paper roll stuffed with grilled beef, herbs, and vermicelli, served with fish sauce.",
    price: 3.50,
    tags: [],
  },
  // Chicken Wings and Fries Appetizers
  {
    id: "app-bbq-chicken-wings",
    categoryId: "appetizers",
    name: "BBQ Chicken Wings (8 pieces)",
    vietnameseName: "Cánh Gà Nướng BBQ",
    description:
      "BBQ chicken wings with lettuce, pickled carrots, and daikon.",
    price: 12.95,
    tags: [],
  },
  {
    id: "app-butter-lime-chicken-wings",
    categoryId: "appetizers",
    name: "Garlic Butter Lime Chicken Wings (8 pieces)",
    vietnameseName: "Cánh Gà Nướng Bơ Tỏi chanh xanh",
    description:
      "Garlic butter lime chicken wings with lettuce, pickled carrots, and daikon.",
    price: 12.95,
    tags: [],
  },
  {
    id: "app-yam-fries",
    categoryId: "appetizers",
    name: "Yam Fries",
    vietnameseName: "Khoai Lang Chiên",
    description:
      "Sweet potato fries with mixed mayonnaise.",
    price: 8.95,
    tags: ["vegetarian"],
  },
  // Starter Soups
  {
    id: "starter-hot-sour-soup",
    categoryId: "starter-soups",
    name: "Hot & Sour Shrimp Soup",
    vietnameseName: "Súp Tom Kha Tôm",
    description:
      "Spicy and sour soup with shrimp, mushrooms, and herbs.",
    price: 8.95,
    tags: [],
    availableAddons: STARTER_SOUP_ADDONS,
  },
  {
    id: "starter-chicken-coconut-mushroom-soup",
    categoryId: "starter-soups",
    name: "Coconut Mushroom Soup",
    vietnameseName: "Súp Nấu Nước Dừa",
    description:
      "Spicy and sour soup with mushrooms and herbs — choose chicken or tofu.",
    price: 8.95,
    tags: [],
    availableFlavors: COCONUT_SOUP_PROTEIN,
    availableAddons: STARTER_SOUP_ADDONS,
  },
  {
    id: "starter-wonton-soup",
    categoryId: "starter-soups",
    name: "Wonton Soup",
    vietnameseName: "Súp Wonton",
    description:
      "Wonton soup with wontons and lettuce.",
    price: 8.95,
    tags: [],
    availableAddons: STARTER_SOUP_ADDONS,
  },

  // Mango Salad Appetizers
  {
    id: "plain-mango-salad",
    categoryId: "mango-salad",
    name: "Plain Mango Salad",
    vietnameseName: "Gỏi Xoài",
    description: "Fresh mango with fish sauce, mint, onions, cilantro and lime.",
    price: 7.95,
    tags: [],
  },
  {
    id: "chicken-shrimp-mango-salad",
    categoryId: "mango-salad",
    name: "Chicken & Shrimp Mango Salad",
    vietnameseName: "Gỏi Xoài Gà & Tôm",
    description: "Fresh mango with steamed chicken, shrimp, fish sauce, mint, onions, cilantro and lime.",
    price: 10.95,
    tags: [],
  },

  // Sides
  {
    id: "side-egg",
    categoryId: "sides",
    name: "Egg",
    vietnameseName: "Trứng",
    description: "Add fried egg",
    price: 2.0,
  },
  {
    id: "side-rice",
    categoryId: "sides",
    name: "White Rice",
    vietnameseName: "Cơm Trắng",
    description: "Add white rice",
    price: 4.0,
  },
  {
    id: "side-brown-rice",
    categoryId: "sides",
    name: "Brown Rice",
    vietnameseName: "Cơm Nâu",
    description: "Add brown rice",
    price: 4.0,
  },
  {
    id: "side-mixed-vegetable",
    categoryId: "sides",
    name: "Mixed Vegetable",
    vietnameseName: "Rau Cải",
    description: "Add mixed vegetable",
    price: 4.0,
  },
  {
    id: "side-pad-thai",
    categoryId: "sides",
    name: "Pad Thai",
    vietnameseName: "Pad Thai",
    description: "Add pad thai",
    price: 4.0,
  },
  {
    id: "side-fried-rice",
    categoryId: "sides",
    name: "Fried Rice",
    vietnameseName: "Cơm Chiên",
    description: "Add fried rice",
    price: 5.0,
  },
  {
    id: "side-soup",
    categoryId: "sides",
    name: "Soup",
    vietnameseName: "Súp",
    description:
      "Add a side of soup. Small $4, large $5. Choose broth: pho, tom yum, chicken, or vegetable.",
    price: 4.0,
    availableSizes: SIDE_SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
    availableFlavors: SIDE_SOUP_BROTH_FLAVORS,
  },
  {
    id: "side-udon-noodle",
    categoryId: "sides",
    name: "Udon Noodle",
    vietnameseName: "Mì Udon",
    description: "Add udon noodle",
    price: 4.0,
  },
  {
    id: "side-vermicelli",
    categoryId: "sides",
    name: "Vermicelli",
    vietnameseName: "Bún",
    description: "Add vermicelli",
    price: 4.0,
  },
  {
    id: "side-rice-noodle",
    categoryId: "sides",
    name: "Rice noodle",
    vietnameseName: "Bún Phở",
    description: "Add rice noodle",
    price: 4.0,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "side-naan",
    categoryId: "sides",
    name: "Naan",
    description: "Add naan",
    price: 4.0,
  },
  {
    id: "side-extra-meat-protein",
    categoryId: "sides",
    name: "Extra meat & protein",
    vietnameseName: "Thêm món thịt",
    description:
      "Add extra to your order. Select one or more: grilled chicken, beef, or pork chop $7; curry chicken $6; curry lamb, shrimp, or oxtail $8; beef balls $6; tofu (white or fried) $5. Rice noodles are available separately as the Rice noodle side in this category.",
    price: 0,
    availableAddons: MEAT_PROTEIN_ADDONS.filter(
      (a) => a.id !== "extra-rice-noodle",
    ),
  },


  // Drinks
  {
    id: "drink-iced-coffee",
    categoryId: "drinks",
    name: "Vietnamese Iced Coffee",
    vietnameseName: "Cà Phê Sữa Đá",
    description: "Strong drip coffee with sweetened condensed milk over ice.",
    price: 5.95,
    tags: ["vegetarian"],
    isFeatured: true,
  },
  {
    id: "drink-fruit-smoothie",
    categoryId: "drinks",
    name: "Fruit Smoothie",
    vietnameseName: "Sinh Tố",
    description: "Fresh fruit smoothie with condensed milk, sugar, and ice. Available in mango, strawberry, pineapple, avocado and banana.",
    price: 6.95,
    tags: ["vegetarian"],
    availableFlavors: SMOOTHIE_FLAVORS,
  },
  {
    id: "drink-hot-tea",
    categoryId: "drinks",
    name: "Hot Tea",
    description:
      "House-brewed hot tea. Choose black tea or jasmine green tea.",
    price: 2.50,
    tags: ["vegetarian", "vegan"],
    availableFlavors: HOT_TEA_FLAVORS,
  },
  {
    id: "drink-bubble-tea",
    categoryId: "drinks",
    name: "Bubble Tea",
    description:
      "Bubble tea with tapioca pearls. Choose flavor — mango, strawberry, original, lychee, peach, honeydew, passion fruit, or taro.",
    price: 6.5,
    tags: ["vegetarian", "vegan"],
    availableFlavors: BUBBLE_TEA_FLAVORS,
  },
  {
    id: "drink-soft-drink",
    categoryId: "drinks",
    name: "Soft Drink",
    description:
      "Canned soft drink. Choose brand — Coke, Coke Zero, Diet Coke, Pepsi, Diet Pepsi, Fuze, root beer, ginger ale, or Crush (orange, grape, or cream soda).",
    price: 1.75,
    tags: ["vegetarian", "vegan"],
    availableFlavors: SOFT_DRINK_FLAVORS,
  },
  {
    id: "drink-water-bottle",
    categoryId: "drinks",
    name: "Water Bottle",
    description: "Bottled water.",
    price: 1.5,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "drink-juice-bottle",
    categoryId: "drinks",
    name: "Juice Bottle",
    description: "Bottled juice — orange or apple.",
    price: 2.0,
    tags: ["vegetarian", "vegan"],
    availableFlavors: JUICE_BOTTLE_FLAVORS,
  },
  {
    id: "drink-jumex",
    categoryId: "drinks",
    name: "Jumex",
    description:
      "Fruit nectar. Choose mango, strawnana, guanabana, pineapple nectar, strawberry, or guava.",
    price: 2.95,
    tags: ["vegetarian", "vegan"],
    availableFlavors: JUMEX_FLAVORS,
  },
  {
    id: "drink-coconut-water",
    categoryId: "drinks",
    name: "Coconut Water",
    description: "Refreshing coconut water. Choose small or large.",
    price: 2.95,
    tags: ["vegetarian", "vegan"],
    availableSizes: COCONUT_WATER_SIZE_OPTIONS,
    defaultSizeId: "small",
  },

  // Desserts
  {
    id: "dessert-cake-slice",
    categoryId: "desserts",
    name: "Cake Slice",
    vietnameseName: "Bánh Cake",
    description:
      "Specially ordered from The Cheesecake Factory. Pick a slice; some flavors add a small upcharge at checkout.",
    price: 6.99,
    tags: ["vegetarian"],
    availableFlavors: DESSERT_CAKE_FLAVORS,
  },

] as MenuItem[]).map((item) => ({
  ...item,
  image: item.image ?? MENU_IMAGES[item.id],
}));

