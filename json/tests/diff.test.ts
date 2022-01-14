import * as fc from 'fast-check'
import _ from 'lodash'
import { JsonObject } from '../src'
import { ArrayOperation, diff, ObjectOperation } from '../src/diff-json'
import { arbitraryJSONArray, arbitraryJSONObject } from './utils'

describe('diff tests', () => {
  it('diffing only yields a diff if objects are different', () => {
    fc.assert(
      fc.property(arbitraryJSONObject(), arbitraryJSONObject(), (left, right) => {
        const result = diff(left, right)
        if (_.isEqual(left, right)) {
          expect(result.operations.length).toEqual(0)
        } else {
          expect(result.operations.length).toBeGreaterThan(0)
        }
      }),
    )
    fc.assert(
      fc.property(arbitraryJSONArray(), arbitraryJSONArray(), (left, right) => {
        const result = diff(left, right)
        if (_.isEqual(left, right)) {
          expect(result.operations.length).toEqual(0)
        } else {
          expect(result.operations.length).toBeGreaterThan(0)
        }
      }),
    )
  })

  const object = ({ key, value }: { key: string; value: unknown }): Record<string, unknown> => {
    if (value === undefined) return {}
    return { [key]: value }
  }

  const childDiffs = (left: JsonObject, right: JsonObject): (ArrayOperation | ObjectOperation)[] =>
    _.chain([...Object.keys(left), ...Object.keys(right)])
      .uniq()
      .map(key => diff(object({ key, value: left[key] }), object({ key, value: right[key] })))
      .map((it): ArrayOperation[] | ObjectOperation[] => it.operations)
      .flatten()
      .value()

  it('the diff of two objects is equivalent to the concatenation of the diffs of their children', () => {
    fc.assert(
      fc.property(arbitraryJSONObject(), arbitraryJSONObject(), (left, right) => {
        const rootDiff = diff(left, right).operations
        const nestedDiffs = childDiffs(left, right)
        expect(rootDiff).toEqual(nestedDiffs)
      }),
    )
  })

  it('specific value that should yield no diff', () => {
    const v1 = {
      a: 1,
      b: {
        a: 1,
        b: 2,
      },
    }
    expect(diff(_.cloneDeep(v1), _.cloneDeep(v1)).operations).toEqual([])
  })
})
