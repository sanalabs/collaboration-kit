import { deepMergeJson, deepPatchJson } from '../src/mutate'

describe('test merge', () => {
  it('keeps references intact', () => {
    const overwrite = (o1: any, o2: any): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      o1.deep = o2.deep
    }

    const source1 = { deep: { a: 1 } }
    const source2 = { deep: { a: 1 } }
    const target = { deep: { a: 1 } }

    const source1RefBefore = source1.deep
    const source2RefBefore = source1.deep

    deepMergeJson(source1, target)
    overwrite(source2, target)

    const source1RefAfter = source1.deep
    const source2RefAfter = source2.deep
    const targetRefAfter = target.deep

    expect(source1RefBefore).toBe(source1RefAfter)
    expect(source1RefBefore).not.toBe(targetRefAfter)
    expect(source1RefBefore).toStrictEqual(targetRefAfter)

    expect(source2RefBefore).not.toBe(source2RefAfter)
  })

  it('undefined deletes keys', () => {
    const source = { deep: { a: 1, b: 2, c: 3 } }
    const target = { deep: { a: 11, b: undefined } }
    deepMergeJson(source, target)
    expect(source).toStrictEqual({ deep: { a: 11, c: 3 } })
  })

  it('does nothing when there is no diff', () => {
    const source = { deep: { a: 1 } }
    const target = { deep: { a: 1 } }

    const sourceRefBefore = source.deep
    deepMergeJson(source, target)
    const sourceRefAfter = source.deep

    expect(source).toStrictEqual({ deep: { a: 1 } })
    expect(sourceRefBefore).toBe(sourceRefAfter)
  })

  it('does nothing when target is empty', () => {
    const source = { deep: { a: 1 } }
    const target = {}

    const sourceRefBefore = source.deep
    deepMergeJson(source, target)
    const sourceRefAfter = source.deep

    expect(source).toStrictEqual({ deep: { a: 1 } })
    expect(sourceRefBefore).toBe(sourceRefAfter)
  })
})

describe('test patch', () => {
  it('keeps references intact', () => {
    const overwrite = (o1: any, o2: any): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      o1.deep = o2.deep
    }

    const source1 = { deep: { a: 1 } }
    const source2 = { deep: { a: 1 } }
    const target = { deep: { a: 1 } }

    const source1RefBefore = source1.deep
    const source2RefBefore = source1.deep

    deepPatchJson(source1, target)
    overwrite(source2, target)

    const source1RefAfter = source1.deep
    const source2RefAfter = source2.deep
    const targetRefAfter = target.deep

    expect(source1RefBefore).toBe(source1RefAfter)
    expect(source1RefBefore).not.toBe(targetRefAfter)
    expect(source1RefBefore).toStrictEqual(targetRefAfter)

    expect(source2RefBefore).not.toBe(source2RefAfter)
  })

  it('undefined deletes keys', () => {
    const source = { deep: { a: 1, b: 2, c: 3 } }
    const target: any = { deep: { a: 11, b: undefined } }
    deepPatchJson(source, target)
    expect(source).toStrictEqual({ deep: { a: 11 } })
  })

  it('does nothing when there is no diff', () => {
    const source = { deep: { a: 1 } }
    const target = { deep: { a: 1 } }

    const sourceRefBefore = source.deep
    deepPatchJson(source, target)
    const sourceRefAfter = source.deep

    expect(source).toStrictEqual({ deep: { a: 1 } })
    expect(sourceRefBefore).toBe(sourceRefAfter)
  })

  it('deletes everything when target is empty', () => {
    const source = { deep: { a: 1 } }
    const target = {}
    deepPatchJson(source, target)
    expect(source).toStrictEqual({})
  })

  it('patches arrays correctly', () => {
    const source: string[] = []
    const target: string[] = ['a']
    deepPatchJson(source, target)
    expect(source).toStrictEqual(target)
  })
})
