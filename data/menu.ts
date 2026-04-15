import { MenuCategory, MenuItem } from "@/lib/types";

// add seafood options to all soups
// add curry chicken and curry lamb to all dishes

// ── Image paths ──────────────────────────────────────────────────────
// Central map so you can swap any photo in one place.
// Keys = menu item id, values = path under /public.
const IMG = "/images/Ginger-Food-Photos";
export const MENU_IMAGES: Record<string, string> = {
  // Pho
  "pho-beef":                       `${IMG}/rare-beef-pho.jpg`,
  "pho-rarebeef-AAA":               `${IMG}/rare-beef-pho-close.jpg`,
  "pho-oxtail-beef-balls":          `${IMG}/oxtail-beefball-pho.webp`,
  "pho-special":                    `${IMG}/rare-beef-pho-far.jpg`,
  "pho-tofu-vegetable":             `${IMG}/tofu-veggie-pho.jpg`,
  // Tom Yum
  "tom-yum-seafood":                `${IMG}/seafood-tom-yum.jpg`,
  // Banh Mi
  "banh-mi-chicken":                `${IMG}/chicken-banhmi.jpg`,
  "banh-mi-beef":                   `${IMG}/beef-banhmi.jpg`,
  "banh-mi-grilled-pork":           `${IMG}/pork-banhmi.webp`,
  // Rice Plates
  "rice-grilled-chicken":           `${IMG}/grilled-chicken-rice.jpg`,
  "rice-curry-chicken":             `${IMG}/curry-chicken-rice.webp`,
  "rice-curry-lamb":                `${IMG}/curry-lamb-rice.webp`,
  "rice-curry-chicken-beef":        `${IMG}/curry-chicken-beef.jpg`,
  "rice-grilled-chicken-pork-chop": `${IMG}/chicken-porkchop-rice.jpg`,
  "rice-grilled-porkchop-and-coconut-shrimp": `${IMG}/coco-shrimp-porkchop-rice.webp`,
  "rice-grilled-chicken-beef-shrimp-roll":    `${IMG}/chicken-beef-shrimp-roll-rice.jpg`,
  // Specialty Plates
  "specialty-chicken-shrimp-pad-thai":       `${IMG}/chicken-shrimp-padthai.jpg`,
  "specialty-chicken-beef-teriyaki-udon":    `${IMG}/chicken-beef-udon.jpg`,
  "specialty-assorted-meat-seafood-mixed-vegetable-with-crispy-noodle": `${IMG}/specialty-assorted-meat-seafood-mixed-vegetable-with-crispy-noodle.jpg`,
  "specialty-tofu-mixed-vegetable-with-crispy-noodle":                  `${IMG}/tofu-veggie-crispy-noodle.jpg`,
  "specialty-lemongrass-tofu-mixed-vegetable-with-pad-thai":            `${IMG}/lemongrass-tofu-mixed-vegetable-with-pad-thai.webp`,
  "specialty-shrimp-fried-rice":     `${IMG}/shrimp-fried-rice.jpg`,
  // Salmon & Fried Fish
  "pan-fried-salmon-mango-salad":    `${IMG}/pan-fried-salmon-mango-salad.jpg`,
  "teriyaki-salmon-mixed-vegetable-rice": `${IMG}/salmon-teriyaki.webp`,
  "fried-fish-mango-salad":          `${IMG}/fried-fish-mango.jpg`,
  "fish-chips":                      `${IMG}/fish-chips.webp`,
  // Vermicelli
  "vermicelli-grilled-chicken":      `${IMG}/chicken-vermicelli.jpg`,
  "vermicelli-grilled-shrimp":       `${IMG}/shrimp-vermicelli.webp`,
  // Appetizers
  "app-chicken-spring-roll":         `${IMG}/cha-gio-ga.jpg`,
  "app-chicken-salad-rolls":         `${IMG}/chicken-goi-cuon.webp`,
  "app-shrimp-salad-rolls":          `${IMG}/shrimp-goi-cuon.webp`,
  "app-butter-lime-chicken-wings":   `${IMG}/garlic-butter-lime-wings.jpg`,
  // Starter Soups
  "starter-chicken-coconut-mushroom-soup": `${IMG}/chicken-coco-mushroom-better.webp`,
  "starter-wonton-soup":             `${IMG}/wonton-soup.jpg`,
  // Mango Salad
  "chicken-shrimp-mango-salad":      `${IMG}/chicken-shrimp-mango.webp`,
  // Drinks
  "drink-iced-coffee":               `${IMG}/cafe-sua-da.jpg`,
  "drink-fruit-smoothie":            `${IMG}/smoothies.jpg`,
  "drink-bubble-tea":                `${IMG}/boba.webp`,
  // Desserts
  "dessert-cake-slice":              `${IMG}/white-choco-rasb-cheesecake.webp`,
};

export const SOUP_ADDONS = [
  { id: "addon-meat", name: "Meat", price: 7.00 },
  { id: "addon-oxtail", name: "Oxtail", price: 8.00 },
  { id: "addon-beef-balls", name: "Beef Balls", price: 6.00 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.00 },
  { id: "addon-tofu", name: "Tofu", price: 5.00 },
  { id: "addon-grain", name: "Grain", price: 4.00 },
];

export const SOUP_ADDONS_SEAFOOD = [
  { id: "shrimp", name: "Shrimp", price: 8.00 }, // shrimp, squid, mussels, and crab meat
  { id: "squid", name: "Squid", price: 8.00 }, // shrimp, squid, mussels, and crab meat
  { id: "mussels", name: "Mussels", price: 8.00 }, // shrimp, squid, mussels, and crab meat
  { id: "crab-meat", name: "Crab Meat", price: 8.00 }, // shrimp, squid, mussels, and crab meat
];

export const DISH_ADDONS = [
  { id: "addon-meat", name: "Meat", price: 7.00 },
  { id: "addon-egg", name: "Egg", price: 2.00 },
  { id: "addon-vegetable", name: "Vegetable", price: 5.00 },
  { id: "addon-tofu", name: "Tofu", price: 5.00 },
  { id: "addon-grain", name: "Grain", price: 4.00 },
  { id: "fried-rice", name: "Fried Rice", price: 5.00 },
  { id: "addon-shrimp", name: "Shrimp", price: 8.00 },
];

export const DISH_ADDONS_SPECIAL = [
  { id: "curry-chicken", name: "Curry Chicken", price: 6.00 },
  { id: "curry-lamb", name: "Curry Lamb", price: 8.95 },
]

export const SMOOTHIE_FLAVORS = [
  { id: "strawberry", name: "Strawberry", price: 0.00 },
  { id: "banana", name: "Banana", price: 0.00 },
  { id: "mango", name: "Mango", price: 0.00 },
  { id: "pineapple", name: "Pineapple", price: 0.00 },
  { id: "avocado", name: "Avocado", price: 0.00 },
];

export const SOUP_SIZE_OPTIONS = [
  { id: "small", label: "Small", priceDelta: 0 },
  { id: "large", label: "Large", priceDelta: 2 },
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
  },
  {
    id: "desserts",
    name: "Desserts",
    description: "Slices of cake, specially ordered from The Cheesecake Factory",
  },
];

export const menuItems: MenuItem[] = ([
  // Pho
  {
    id: "pho-beef", // add rare or brisket option or both
    categoryId: "pho",
    name: "Classic Beef Pho",
    vietnameseName: "Phở Bò",
    description:
      "Rice noodles in aromatic beef broth with rare beef or brisket or both, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    isFeatured: true,
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
  },
  {
    id: "pho-chicken",
    categoryId: "pho",
    name: "Chicken Pho",
    vietnameseName: "Phở Gà",
    description:
      "Rice noodles in aromatic beef broth with steamed chicken or grilled chicken topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
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
    tags: ["vegan"],
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
    availableSizes: SOUP_SIZE_OPTIONS,
    defaultSizeId: "small",
  },
  {
    id: "tom-yum-chicken",
    categoryId: "tom-yum",
    name: "Tom Yum Chicken",
    vietnameseName: "Tom Yum Gà",
    description:
      "Rice noodles in aromatic hot and sour broth with steamed chicken, topped with onions, saw leaf, basil, beansprout and lime.",
    price: 15.5,
    tags: [],
    availableAddons: SOUP_ADDONS,
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
    availableAddons: SOUP_ADDONS,
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
    tags: ["vegan"],
    availableAddons: SOUP_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
  },
  {
    id: "rice-grilled-porkchop-and-coconut-shrimp",
    categoryId: "rice-plates",
    name: "Grilled Shrimp Rice Plate",
    vietnameseName: "Cơm Sườn Tôm Rim Nước Dưa",
    description:
      "Grilled shrimp with jasmine rice and bokchoy.",
    price: 17.95,
    tags: [],
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
  },
  // Salmon & Fried Fish
  {
    id: "pan-fried-salmon-mango-salad",
    categoryId: "salmon-fried-fish",
    name: "Pan Fried Salmon & Mango Salad Plate",
    vietnameseName: "Cá Salmon & Gỏi Xoài",
    description:
      "Pan fried salmon & mango salad with jasmine rice, bokchoy, and fish sauce.",
    price: 20.95,
    tags: [],
  },
  {
    id: "teriyaki-salmon-mixed-vegetable-rice",
    categoryId: "salmon-fried-fish",
    name: "Teriyaki Salmon & Mixed Vegetable Rice Plate",
    vietnameseName: "Cá Salmon Teriyaki & Rau Cải",
    description:
      "Teriyaki salmon & mixed vegetable with jasmine rice and bokchoy.",
    price: 20.95,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
    availableAddons: DISH_ADDONS,
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
  },
  {
    id: "starter-chicken-coconut-mushroom-soup", // add a tofu option
    categoryId: "starter-soups",
    name: "Chicken Coconut Mushroom Soup",
    vietnameseName: "Súp Gà Nấu Nước Dừa",
    description:
      "Spicy and sour soup with chicken, mushrooms, and herbs.",
    price: 8.95,
    tags: [],
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
    id: "side-soup-large",
    categoryId: "sides",
    name: "Soup",
    vietnameseName: "Súp",
    description: "Add Pho or Tom Yum or Vegetable soup",
    price: 5.0,
  },
  {
    id: "side-soup-small",
    categoryId: "sides",
    name: "Soup",
    vietnameseName: "Súp",
    description: "Add Pho or Tom Yum or Vegetable soup",
    price: 4.0,
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


  // Drinks
  {
    id: "drink-iced-coffee", // add hot coffee option
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
    id: "drink-hot-tea", // add option
    categoryId: "drinks",
    name: "Hot Tea",
    description: "Refreshing house-brewed tea. Available in black tea, jasmine green tea",
    price: 1.95,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "drink-bubble-tea",
    categoryId: "drinks",
    name: "Bubble Tea",
    description: "Bubble tea with tapioca pearls.", // Mango, Strawberry,OG,Lychee,Peach,Honeydew,PassionFruit,Taro
    price: 6.50,
    tags: ["vegetarian", "vegan"],
  },
  {
    /*
    Coke, Diet Coke, Pepsi, Diet Pepsi, Fuze, RootBeer, Gingerale, Crush(Grape, CreamSoda,),
    */
    id: "drink-soft-drink",
    categoryId: "drinks",
    name: "Soft Drink",
    description: "Assorted canned soft drinks and juices.",
    price: 1.75,
    tags: ["vegetarian", "vegan"],
  },
  { // orange apple
    id: "drink-juice-bottle",
    categoryId: "drinks",
    name: "Juice Bottle",
    description: "Assorted bottled juices.",
    price: 2.0,
    tags: ["vegetarian", "vegan"],
  },
  { // Mango, Strawnana, Guanabana, Pineapple Nectar, Strawbery, Guava
    id: "drink-jumex",
    categoryId: "drinks",
    name: "Jumex",
    description: "Available in mango, strawberry, pineapple, avocado and banana.",
    price: 2.95,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "drink-coconut-water-small",
    categoryId: "drinks",
    name: "Jumex",
    description: "Coconut water",
    price: 2.95,
    tags: ["vegetarian", "vegan"],
  },
  {
    id: "drink-coconut-water-large",
    categoryId: "drinks",
    name: "Jumex",
    description: "Coconut water",
    price: 3.95,
    tags: ["vegetarian", "vegan"],
  },

  // Desserts
  { // Wild Strawberries & Cream Cheese Cake, Godiva Double Chocolate Cheese Cake(+0.51), White Chocolate Raspberry Cheesecake, Mango Key Lime Cheesecake(+0.51), Red Velvet Cheesecake
    id: "dessert-cake-slice",
    categoryId: "desserts",
    name: "Cake Slice",
    vietnameseName: "Bánh Cake",
    description:
      "From the Cheesecake Factory.",
    price: 6.99,
    tags: ["vegetarian"],
  },

] as MenuItem[]).map((item) => ({
  ...item,
  image: item.image ?? MENU_IMAGES[item.id],
}));

