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
    const target: any = { deep: { a: 11, b: undefined } }
    deepMergeJson(source, target)
    expect(source).toStrictEqual({ deep: { a: 11, c: 3 } })
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
})
