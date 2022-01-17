import * as fc from 'fast-check'
import * as Y from 'yjs'
import { deepPatchJson } from '../../json/src'
import { patchYJson } from '../src/patch-y-type'
import * as utils from './utils'

describe('patchYJson tests', () => {
  it('patching ymaps is idempotent', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), state => {
        const yMap = utils.makeYMap()
        patchYJson(yMap, state)
        const firstJson: unknown = yMap.toJSON()

        yMap.observeDeep(() => {
          throw new Error('Nothing in the ymap should have changed')
        })

        patchYJson(yMap, state)
        const secondJson: unknown = yMap.toJSON()
        expect(firstJson).toEqual(secondJson)
      }),
    )
  })

  it('patching yarrays is idempotent', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONArray(), state => {
        const yArray = utils.makeYArray()
        patchYJson(yArray, state)
        const firstJson: unknown = yArray.toJSON()

        yArray.observeDeep(() => {
          throw new Error('Nothing in the yArray should have changed')
        })

        patchYJson(yArray, state)
        const secondJson: unknown = yArray.toJSON()
        expect(firstJson).toEqual(secondJson)
      }),
    )
  })

  it('handles arbitrary ymap mutations', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), utils.arbitraryJSONObject(), (firstState, secondState) => {
        const yMap = utils.makeYMap()
        patchYJson(yMap, firstState)
        expect(yMap.toJSON()).toEqual(firstState)
        patchYJson(yMap, secondState)
        expect(yMap.toJSON()).toEqual(secondState)
      }),
      { numRuns: 10000 },
    )
  })

  it('handles long strings in maps', () => {
    fc.assert(
      fc.property(utils.arbitraryLongString(), utils.arbitraryLongString(), (string1, string2) => {
        const current = { '0': string1 }
        const expected = { '0': string2 }
        const yMap = utils.makeYMap()
        patchYJson(yMap, current)
        patchYJson(yMap, expected)
      }),
    )
  })

  it('handles long strings in arrays', () => {
    fc.assert(
      fc.property(utils.arbitraryLongString(), utils.arbitraryLongString(), (string1, string2) => {
        const yArray = utils.makeYArray()
        patchYJson(yArray, [string1])
        patchYJson(yArray, [string2])
        expect(yArray.toJSON()).toEqual([string2])
      }),
    )
  })

  it('handles arbitrary yarray mutations', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONArray(), utils.arbitraryJSONArray(), (firstState, secondState) => {
        const yArray = utils.makeYArray()
        patchYJson(yArray, firstState)
        expect(yArray.toJSON()).toEqual(firstState)
        patchYJson(yArray, secondState)
        expect(yArray.toJSON()).toEqual(secondState)
      }),
      { numRuns: 1000 },
    )
  })

  it('handles yarray substitutions efficiently', () => {
    const arrayLength = 10000
    const iterations = 100
    const state: number[] = []
    for (let i = 0; i < arrayLength; i++) {
      state.push(i)
    }
    const yArray = utils.makeYArray()
    for (let i = 0; i < iterations; i++) {
      state[Math.floor(Math.random() * arrayLength)] = Math.random()
      patchYJson(yArray, state)
      expect(yArray.toJSON()).toEqual(state)
    }
  })

  it('patchYJson and deepPatchJson work the same way', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), randomObject => {
        const yMap = utils.makeYMap()
        const redux = {}
        patchYJson(yMap, randomObject)
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
    patchYJson(yMap, { state: '1' }, { origin: 'test' })
    expect(receivedOrigin).toEqual('test')
  })

  it('chained patchYJsons do not cause equality issues', () => {
    const yMap = utils.makeYMap()
    yMap.observeDeep((e, { origin }) => {
      if (origin === 'test') {
        expect(yMap.toJSON()).toEqual({ state: '1' })
        patchYJson(yMap, { state: '2' }, { origin: 'test-2' })
        return
      }
      if (origin !== 'test-2') throw new Error('unexpected origin')
    })
    patchYJson(yMap, { state: '1' }, { origin: 'test' })
    expect(yMap.toJSON()).toEqual({ state: '2' })
  })

  it('to throw deep', () => {
    const yMap = utils.makeYMap()
    const yMapMap = new Y.Map()
    yMap.set('a', yMapMap)
    const yXmlText = new Y.XmlText()
    yMapMap.set('xmlText', yXmlText)
    yXmlText.insert(0, 'hello')
    yXmlText.format(1, 3, { italic: true })

    expect(() => patchYJson(yMap, {})).toThrowError(
      new Error("assertIsYJson: Expected YXmlText to be YMap or YArray at yType.get('a').get('xmlText')"),
    )
  })

  it('to throw deep undefined', () => {
    const yMap = utils.makeYMap()
    const yMapMap = new Y.Map()
    yMap.set('a', yMapMap)
    yMapMap.set('b', undefined) // Yes we want to disallow this. YArray thwos on undefined. Want to avoid this inconsistency.

    expect(() => patchYJson(yMap, {})).toThrowError(
      new Error(
        "assertIsYJson: Expected undefined to be JSON primitive (string | number | boolean | null) at yType.get('a').get('b')",
      ),
    )
  })
})
