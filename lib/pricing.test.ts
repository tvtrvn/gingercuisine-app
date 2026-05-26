import { describe, it, expect } from 'vitest'
import type { MenuItem, SizeOption, AddonOption } from '@/lib/types'
import { computeUnitPrice, computeCartTotals } from '@/lib/pricing'

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

  it('single item, qty 3 — tax rounds half-up', () => {
    // tax = round2(37.50 * 0.13) = round2(4.875) = 4.88
    expect(computeCartTotals([{ unitPrice: 12.50, quantity: 3 }], 0.13)).toEqual({
      subtotal: 37.50,
      tax: 4.88,
      total: 42.38,
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
