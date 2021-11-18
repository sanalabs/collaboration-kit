import * as fc from 'fast-check'
import { deepPatchJson } from '../../json/src'
import { patchYType } from '../src/patch-y-type'
import * as utils from './utils'

describe('patchYType tests', () => {
  it('patching ymaps is idempotent', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), state => {
        const yMap = utils.makeYMap()
        patchYType(yMap, state)
        const firstJson: unknown = yMap.toJSON()

        yMap.observeDeep(() => {
          throw new Error('Nothing in the ymap should have changed')
        })

        patchYType(yMap, state)
        const secondJson: unknown = yMap.toJSON()
        expect(firstJson).toEqual(secondJson)
      }),
    )
  })

  it('patching yarrays is idempotent', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONArray(), state => {
        const yArray = utils.makeYArray()
        patchYType(yArray, state)
        const firstJson: unknown = yArray.toJSON()

        yArray.observeDeep(() => {
          throw new Error('Nothing in the yArray should have changed')
        })

        patchYType(yArray, state)
        const secondJson: unknown = yArray.toJSON()
        expect(firstJson).toEqual(secondJson)
      }),
    )
  })

  it('handles arbitrary ymap mutations', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), utils.arbitraryJSONObject(), (firstState, secondState) => {
        const yMap = utils.makeYMap()
        patchYType(yMap, firstState)
        expect(yMap.toJSON()).toEqual(firstState)
        patchYType(yMap, secondState)
        expect(yMap.toJSON()).toEqual(secondState)
      }),
      { numRuns: 1000 },
    )
  })

  it('handles long strings in maps', () => {
    fc.assert(
      fc.property(utils.arbitraryLongString(), utils.arbitraryLongString(), (string1, string2) => {
        const current = { '0': string1 }
        const expected = { '0': string2 }
        const yMap = utils.makeYMap()
        patchYType(yMap, current)
        patchYType(yMap, expected)
      }),
    )
  })

  it('handles long strings in arrays', () => {
    fc.assert(
      fc.property(utils.arbitraryLongString(), utils.arbitraryLongString(), (string1, string2) => {
        const yArray = utils.makeYArray()
        patchYType(yArray, [string1])
        patchYType(yArray, [string2])
        expect(yArray.toJSON()).toEqual([string2])
      }),
    )
  })

  it('handles arbitrary yarray mutations', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONArray(), utils.arbitraryJSONArray(), (firstState, secondState) => {
        const yArray = utils.makeYArray()
        patchYType(yArray, firstState)
        expect(yArray.toJSON()).toEqual(firstState)
        patchYType(yArray, secondState)
        expect(yArray.toJSON()).toEqual(secondState)
      }),
      { numRuns: 1000 },
    )
  })

  it('patchYType and deepPatchJson work the same way', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), randomObject => {
        const yMap = utils.makeYMap()
        const redux = {}
        patchYType(yMap, randomObject)
        deepPatchJson(redux, yMap.toJSON())

        expect(redux).toEqual(randomObject)
        expect(redux).toEqual(yMap.toJSON())
      }),
      { numRuns: 1000 },
    )
  })

  it('is possible to specify the origin of a transaction', () => {
    const yMap = utils.makeYMap()
    let receivedOrigin: unknown = undefined
    yMap.observeDeep((e, { origin }) => {
      receivedOrigin = origin
    })
    patchYType(yMap, { state: '1' }, { origin: 'test' })
    expect(receivedOrigin).toEqual('test')
  })

  it('chained patchYTypes do not cause equality issues', () => {
    const yMap = utils.makeYMap()
    yMap.observeDeep((e, { origin }) => {
      if (origin === 'test') {
        expect(yMap.toJSON()).toEqual({ state: '1' })
        patchYType(yMap, { state: '2' }, { origin: 'test-2' })
        return
      }
      if (origin !== 'test-2') throw new Error('unexpected origin')
    })
    patchYType(yMap, { state: '1' }, { origin: 'test' })
    expect(yMap.toJSON()).toEqual({ state: '2' })
  })
})
