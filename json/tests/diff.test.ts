import * as fc from 'fast-check'
import _ from 'lodash'
import { diff } from '../src/diff-json'
import { arbitraryJSONArray, arbitraryJSONObject } from './utils'

describe('patchYJson tests', () => {
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
