import { longestCommonSubsequence } from '../src/patch-y-type/lcs'

describe('longestCommonSubsequence', () => {
  it('returns empty when no overlap', () => {
    const lcs = longestCommonSubsequence([0], [1, 2, 3], new Map())
    expect(lcs).toEqual([])
  })
  it('returns longest common subsequence', () => {
    let lcs = longestCommonSubsequence([0, 1], [0, 1, 2, 3], new Map())
    expect(lcs).toEqual([0, 1])

    lcs = longestCommonSubsequence([0, { a: 1 }], [{ a: 3 }, 1], new Map())
    expect(lcs).toEqual([])

    lcs = longestCommonSubsequence([0, { a: 1 }], [{ a: 1 }, 1], new Map())
    expect(lcs).toEqual([{ a: 1 }])

    lcs = longestCommonSubsequence([4, 3, 1, 2], [1, 2, 3, 4], new Map())
    expect(lcs).toEqual([1, 2])
  })
  it('evaluates deep equality', () => {
    const lcs = longestCommonSubsequence([{ a: ['b', 'c'] }], [{ a: ['b', 'c'] }], new Map())
    expect(lcs).toEqual([{ a: ['b', 'c'] }])
  })
})
