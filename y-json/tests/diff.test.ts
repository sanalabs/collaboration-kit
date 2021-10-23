import { diff, Diff } from '../src/diff'

describe('test diff', () => {
  it('detects deleted keys', () => {
    const a = { a: true }
    const b = {}
    expect(diff(a, b)).toEqual([{ type: 'delete', key: 'a' }])
  })

  it('detects nested deleted keys', () => {
    const a = { a: { a: true } }
    const b = { a: {} }
    expect(diff(a, b)).toEqual([{ type: 'nest', key: 'a', diffs: [{ type: 'delete', key: 'a' }] }])
  })

  it('does not include upserts for things that have not changed', () => {
    const a = { a: true, b: true }
    const b = { a: true, b: false }

    expect(diff(a, b)).toEqual([{ type: 'upsert', key: 'b', value: false }])
  })

  it('can handle complicated nested diffs', () => {
    const a = {
      a: { a: true },
      b: {
        a: true,
      },
    }
    const b = {
      // Removed: a: { a: true }
      b: {
        a: false, // Updated
        b: true, // Inserted
      },
    }
    const expectedDiffs: Diff[] = [
      { type: 'delete', key: 'a' },
      {
        type: 'nest',
        key: 'b',
        diffs: [
          { type: 'upsert', key: 'a', value: false },
          { type: 'upsert', key: 'b', value: true },
        ],
      },
    ]

    expect(diff(a, b)).toEqual(expectedDiffs)
  })

  it('can detect elements added to an array', () => {
    const a = [] as const
    const b = [1, 2, 3] as const

    expect(diff(a, b)).toEqual([
      { type: 'array-upsert', index: 0, value: 1 },
      { type: 'array-upsert', index: 1, value: 2 },
      { type: 'array-upsert', index: 2, value: 3 },
    ])
  })

  it('can detect elements removed from an array', () => {
    const a = [1] as const
    const b = [] as const

    expect(diff(a, b)).toEqual([{ type: 'array-delete', index: 0 }])
  })

  it('can detect multiple elements removed from an array', () => {
    const a = [1, 2, 3, 4, 5] as const
    const b = [2, 4] as const

    expect(diff(a, b)).toEqual([
      { type: 'array-delete', index: 0 },
      { type: 'array-delete', index: 1 },
      { type: 'array-delete', index: 2 },
    ])
  })

  it('can detect when no elements in an array have been changed', () => {
    expect(diff([], [])).toEqual([])
    expect(diff([1, 2, 3], [1, 2, 3])).toEqual([])
    expect(diff([{ a: 1 }], [{ a: 1 }])).toEqual([])
  })

  it('can handle diffs in objects containing arrays', () => {
    const a = { arr: [1, 2, 3] }

    const b = { arr: [1, 3] }

    expect(diff(a, b)).toEqual([
      { type: 'array-nest', key: 'arr', diffs: [{ type: 'array-delete', index: 1 }] },
    ])
  })
})
