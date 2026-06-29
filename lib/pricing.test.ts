import { describe, it, expect } from 'vitest'
import type { MenuItem, SizeOption, AddonOption } from '@/lib/types'
import {
  computeUnitPrice,
  computeCartTotals,
  priceCart,
  PricingError,
} from '@/lib/pricing'
import { menuItems } from '@/data/menu'

function makeItem(price: number, opts?: Partial<MenuItem>): MenuItem {
  return {
    id: 'test-item',
    categoryId: 'pho',
    name: 'Test Item',
    description: '',
    price,
    ...opts,
  }
}

describe('computeUnitPrice', () => {
  it('plain item — no modifiers', () => {
    const item = makeItem(12.50)
    expect(computeUnitPrice(item)).toBe(12.50)
  })

  it('with size delta', () => {
    const item = makeItem(12.50)
    const size: SizeOption = { id: 'lg', label: 'Large', priceDelta: 2.00 }
    expect(computeUnitPrice(item, size)).toBe(14.50)
  })

  it('with addons', () => {
    const item = makeItem(10.00)
    const addons: AddonOption[] = [
      { id: 'a1', name: 'Addon 1', price: 1.50 },
      { id: 'a2', name: 'Addon 2', price: 2.25 },
    ]
    expect(computeUnitPrice(item, undefined, addons)).toBe(13.75)
  })

  it('with flavor', () => {
    const item = makeItem(8.00)
    const flavor: AddonOption = { id: 'f1', name: 'Spicy', price: 0.50 }
    expect(computeUnitPrice(item, undefined, undefined, flavor)).toBe(8.50)
  })

  it('all modifiers combined', () => {
    const item = makeItem(12.50)
    const size: SizeOption = { id: 'lg', label: 'Large', priceDelta: 2.00 }
    const addons: AddonOption[] = [
      { id: 'a1', name: 'Addon 1', price: 1.50 },
      { id: 'a2', name: 'Addon 2', price: 2.25 },
    ]
    const flavor: AddonOption = { id: 'f1', name: 'Spicy', price: 0.50 }
    expect(computeUnitPrice(item, size, addons, flavor)).toBe(18.75)
  })

  it('float-drift edge — must return exactly 17.50', () => {
    const item = makeItem(15.49)
    const addons: AddonOption[] = [{ id: 'a1', name: 'Extra', price: 2.01 }]
    const result = computeUnitPrice(item, undefined, addons)
    expect(result).toBe(17.50)
  })

  it('empty addons array (not undefined)', () => {
    const item = makeItem(10)
    expect(computeUnitPrice(item, undefined, [])).toBe(10)
  })

  it('all modifiers explicitly undefined', () => {
    const item = makeItem(12.50)
    expect(computeUnitPrice(item, undefined, undefined, undefined)).toBe(12.50)
  })

  // A dish whose DEFAULT base is premium (+$1) lists a price that already
  // includes that dollar — e.g. Chicken & Shrimp Pad Thai at 18.95 with a
  // default Pad Thai base. The default base must NOT be charged again; only
  // switching to a *different* base adds that base's delta.
  describe('premium default base — delta already in listed price', () => {
    const padThai: SizeOption = { id: 'base-pad-thai', label: 'Pad Thai', priceDelta: 1.0 }
    const udon: SizeOption = { id: 'base-udon', label: 'Udon', priceDelta: 1.0 }
    const whiteRice: SizeOption = { id: 'base-white-rice', label: 'White Rice', priceDelta: 0 }
    const item = makeItem(18.95, {
      availableSizes: [whiteRice, padThai, udon],
      defaultSizeId: 'base-pad-thai',
    })

    it('on its default premium base — listed price, no double-charge', () => {
      expect(computeUnitPrice(item, padThai)).toBe(18.95)
    })

    it('switched to a cheaper base — listed price (no discount)', () => {
      expect(computeUnitPrice(item, whiteRice)).toBe(18.95)
    })

    it('switched to a different premium base — adds $1', () => {
      expect(computeUnitPrice(item, udon)).toBe(19.95)
    })

    it('rice plate (cheap default) switched up to a premium base — adds $1', () => {
      const ricePlate = makeItem(13.95, {
        availableSizes: [whiteRice, padThai, udon],
        defaultSizeId: 'base-white-rice',
      })
      expect(computeUnitPrice(ricePlate, whiteRice)).toBe(13.95)
      expect(computeUnitPrice(ricePlate, padThai)).toBe(14.95)
    })
  })
})

describe('computeCartTotals', () => {
  it('empty cart', () => {
    expect(computeCartTotals([], 0.13)).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })

  it('single item, qty 1', () => {
    expect(computeCartTotals([{ unitPrice: 10, quantity: 1 }], 0.13)).toEqual({
      subtotal: 10,
      tax: 1.30,
      total: 11.30,
    })
  })

  it('single item, qty 3 — tax ceils to the cent', () => {
    // tax = ceil2(37.50 * 0.13) = ceil2(4.875) = 4.88
    expect(computeCartTotals([{ unitPrice: 12.50, quantity: 3 }], 0.13)).toEqual({
      subtotal: 37.50,
      tax: 4.88,
      total: 42.38,
    })
  })

  it('fractional cent in tax is rounded UP, never down', () => {
    // Butter chicken on rice: 18.95 * 0.13 = 2.4635.
    // round-half would give 2.46 / total 21.41 (a cent short); ceiling gives 2.47.
    expect(computeCartTotals([{ unitPrice: 18.95, quantity: 1 }], 0.13)).toEqual({
      subtotal: 18.95,
      tax: 2.47,
      total: 21.42,
    })
  })

  it('whole-cent tax is not over-rounded by float noise', () => {
    // 10 * 0.13 stores as 1.3000000000000003; ceiling must still yield 1.30, not 1.31.
    expect(computeCartTotals([{ unitPrice: 10, quantity: 1 }], 0.13)).toEqual({
      subtotal: 10,
      tax: 1.30,
      total: 11.30,
    })
  })

  it('multi-item cart', () => {
    // subtotal = 10*2 + 5.50*1 = 25.50; tax = round2(25.50 * 0.13) = round2(3.315) = 3.32
    const items = [
      { unitPrice: 10, quantity: 2 },
      { unitPrice: 5.50, quantity: 1 },
    ]
    expect(computeCartTotals(items, 0.13)).toEqual({
      subtotal: 25.50,
      tax: 3.32,
      total: 28.82,
    })
  })

  it('zero tax rate', () => {
    expect(computeCartTotals([{ unitPrice: 10, quantity: 1 }], 0)).toEqual({
      subtotal: 10,
      tax: 0,
      total: 10,
    })
  })

  it('rounding edge — subtotal rounds half-up', () => {
    // round2(10.005) = Math.round(10.005 * 100) / 100 = Math.round(1000.5) / 100 = 1001/100 = 10.01
    expect(computeCartTotals([{ unitPrice: 10.005, quantity: 1 }], 0)).toEqual({
      subtotal: 10.01,
      tax: 0,
      total: 10.01,
    })
  })
})

describe('priceCart sold-out / availability enforcement', () => {
  // Synthetic merged menu (the kind getMenuItems() now returns). The default
  // size ('lg') is sold out so a no-size selection resolves to a sold-out
  // option — proving server enforcement on the default/fallback path.
  const soup: MenuItem = {
    id: 'soup',
    categoryId: 'pho',
    name: 'Soup',
    description: '',
    price: 10,
    defaultSizeId: 'lg',
    availableSizes: [
      { id: 'sm', label: 'Small', priceDelta: 0 },
      { id: 'lg', label: 'Large', priceDelta: 2, soldOut: true },
    ],
    availableAddons: [{ id: 'egg', name: 'Egg', price: 1.5, soldOut: true }],
    availableFlavors: [
      { id: 'mild', name: 'Mild', price: 0 },
      { id: 'spicy', name: 'Spicy', price: 0.5, soldOut: true },
    ],
  }
  const special: MenuItem = {
    id: 'special',
    categoryId: 'pho',
    name: 'Special',
    description: '',
    price: 20,
    available: false,
  }
  const menu = [soup, special]

  it('empty cart throws', () => {
    expect(() => priceCart([], menu)).toThrow(PricingError)
  })

  it('unknown item throws', () => {
    expect(() => priceCart([{ menuItemId: 'nope', quantity: 1 }], menu)).toThrow(
      PricingError,
    )
  })

  it('happy path — available size, no modifiers', () => {
    const priced = priceCart(
      [{ menuItemId: 'soup', quantity: 1, selectedSizeId: 'sm' }],
      menu,
    )
    expect(priced.items[0].unitPrice).toBe(10)
    expect(priced.subtotal).toBe(10)
  })

  it('rejects an item marked available:false', () => {
    expect(() =>
      priceCart([{ menuItemId: 'special', quantity: 1 }], menu),
    ).toThrow(/sold out/i)
  })

  it('rejects a sold-out DEFAULT size (no explicit size selected)', () => {
    // No selectedSizeId → resolves to defaultSizeId 'lg', which is sold out.
    expect(() =>
      priceCart([{ menuItemId: 'soup', quantity: 1 }], menu),
    ).toThrow(/sold out/i)
  })

  it('rejects a sold-out add-on', () => {
    expect(() =>
      priceCart(
        [
          {
            menuItemId: 'soup',
            quantity: 1,
            selectedSizeId: 'sm',
            selectedAddonIds: ['egg'],
          },
        ],
        menu,
      ),
    ).toThrow(/sold out/i)
  })

  it('rejects a sold-out flavor', () => {
    expect(() =>
      priceCart(
        [
          {
            menuItemId: 'soup',
            quantity: 1,
            selectedSizeId: 'sm',
            selectedFlavorId: 'spicy',
          },
        ],
        menu,
      ),
    ).toThrow(/sold out/i)
  })

  it('allows an available flavor + size combination', () => {
    const priced = priceCart(
      [
        {
          menuItemId: 'soup',
          quantity: 1,
          selectedSizeId: 'sm',
          selectedFlavorId: 'mild',
        },
      ],
      menu,
    )
    expect(priced.items[0].unitPrice).toBe(10)
  })
})

// Regression lock over the REAL catalog for the owner-confirmed base rule
// (see the INTENTIONAL-business-rule comment in lib/pricing.ts). If anyone
// changes the listed prices or "simplifies" the delta logic, these break.
describe('real catalog — premium-default base pricing (owner-confirmed)', () => {
  function findItem(id: string): MenuItem {
    const item = menuItems.find((m) => m.id === id)
    if (!item) throw new Error(`catalog missing ${id}`)
    return item
  }
  function sizeOf(item: MenuItem, sizeId: string): SizeOption {
    const s = item.availableSizes?.find((x) => x.id === sizeId)
    if (!s) throw new Error(`${item.id} missing size ${sizeId}`)
    return s
  }

  const cases = [
    { id: 'specialty-chicken-shrimp-pad-thai', defaultBase: 'base-pad-thai', otherBase: 'base-udon', listed: 18.95, other: 19.95 },
    { id: 'specialty-chicken-beef-teriyaki-udon', defaultBase: 'base-udon', otherBase: 'base-pad-thai', listed: 18.95, other: 19.95 },
    { id: 'specialty-lemongrass-tofu-mixed-vegetable-with-pad-thai', defaultBase: 'base-pad-thai', otherBase: 'base-udon', listed: 19.5, other: 20.5 },
    { id: 'specialty-curry-tofu-mixed-vegetable-eggplant-with-brown-rice', defaultBase: 'base-brown-rice', otherBase: 'base-pad-thai', listed: 16.5, other: 17.5 },
  ]

  for (const c of cases) {
    it(`${c.id}: default base = listed $${c.listed}`, () => {
      const item = findItem(c.id)
      expect(item.price).toBe(c.listed)
      expect(item.defaultSizeId).toBe(c.defaultBase)
      expect(computeUnitPrice(item, sizeOf(item, c.defaultBase))).toBe(c.listed)
    })
    it(`${c.id}: cheap base (white rice) = listed $${c.listed} (no discount)`, () => {
      const item = findItem(c.id)
      expect(computeUnitPrice(item, sizeOf(item, 'base-white-rice'))).toBe(c.listed)
    })
    it(`${c.id}: different premium base = $${c.other} (+$1)`, () => {
      const item = findItem(c.id)
      expect(computeUnitPrice(item, sizeOf(item, c.otherBase))).toBe(c.other)
    })
  }

  it('priceCart (server path) bills the default base at the listed price', () => {
    const priced = priceCart(
      [{ menuItemId: 'specialty-chicken-shrimp-pad-thai', quantity: 1 }],
      menuItems,
    )
    expect(priced.items[0].unitPrice).toBe(18.95)
  })

  it('priceCart (server path) adds $1 when switched to udon', () => {
    const priced = priceCart(
      [{ menuItemId: 'specialty-chicken-shrimp-pad-thai', quantity: 1, selectedSizeId: 'base-udon' }],
      menuItems,
    )
    expect(priced.items[0].unitPrice).toBe(19.95)
  })
})
