import _ from 'lodash'
import { deepPatchJson } from '../../json/src'
import { assertIsYMapOrArray, isYArray, isYMap } from '../src/assertions'
import { patchYType } from '../src/patch-y-type'
import * as utils from './utils'

const tryPatchYType: typeof patchYType = (yType, data) => {
  assertIsYMapOrArray(yType, '')
  const yTypeState: unknown = yType.toJSON()
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    patchYType(yType as any, data as any)
  } catch (e) {
    console.log('State', JSON.stringify(yTypeState, null, 2))
    console.log('Expected State', JSON.stringify(data, null, 2))
    throw new Error(`Failed to patch with error ${JSON.stringify(e)}`)
  }
}

describe('patchYType tests', () => {
  it('can add fields to an empty map', () => {
    const expectedResult = { hello: 'world' }
    const yMap = utils.makeYMap()

    patchYType(yMap, expectedResult)

    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('will mutate itself to resemble the last object that was patched ', () => {
    const yMap = utils.makeYMap()

    const oldData = { a: { a: true }, b: { a: true, b: true } }
    const newData = { b: { a: false, b: true } }

    patchYType(yMap, oldData)
    patchYType(yMap, newData)

    expect(yMap.toJSON()).toEqual(newData)
  })

  it('can patch one array', () => {
    const array = [1, 2, 4]
    const yArray = utils.makeYArray()

    patchYType(yArray, array)
    expect(yArray.toJSON()).toEqual([1, 2, 4])
  })

  it('can patch the differences between two arrays', () => {
    const oldArray = [1, 2, 4]
    const newArray = [1, 2, 3]

    const yArray = utils.makeYArray()

    patchYType(yArray, oldArray)
    patchYType(yArray, newArray)

    expect(yArray.toJSON()).toEqual(newArray)
  })

  it('can patch the differences between objects containing arrays', () => {
    const oldObject = { arr: [1, 2, 4] }
    const newObject = { arr: [1, 2, 3] }

    const yMap = utils.makeYMap()

    patchYType(yMap, oldObject)
    patchYType(yMap, newObject)

    expect(yMap.toJSON()).toEqual(newObject)
  })

  it('uses `Y.Map`s to represent nested maps', () => {
    const yMap = utils.makeYMap()
    const data = { a: { a: true } }

    patchYType(yMap, data)

    if (!isYMap(yMap.get('a'))) fail(`Expected yMap.a to be a yMap. Got: ${JSON.stringify(yMap.get('a'))}`)
  })

  it('uses `Y.Array`s to represent nested arrays', () => {
    const object = { arr: [1, 2, 4] }

    const yMap = utils.makeYMap()

    patchYType(yMap, object)

    const arr = yMap.get('arr')
    if (!isYArray(arr)) fail(`Expected \`arr\` to be a \`Y.Array\`, got ${JSON.stringify(arr)}`)
  })

  it('handles deeply chained mutations of ymaps', () => {
    const yMap = utils.makeYMap()
    _.range(0, 10000).forEach((none, index) => {
      const randomObject = Object.freeze(utils.generateObject())
      const copyYmap: unknown = yMap.toJSON()

      tryPatchYType(yMap, randomObject)

      try {
        patchYType(yMap, randomObject)
      } catch (e) {
        console.log(`Failed to patch with error ${JSON.stringify(e)}`)
        console.log('State', JSON.stringify(yMap.toJSON(), null, 2))
        console.log('Expected State', JSON.stringify(randomObject, null, 2))
        fail(e)
      }

      if (!_.isEqual(yMap.toJSON(), randomObject)) {
        console.log(`MISMATCH at index ${index}`)
        console.log('Previous ymap: ', copyYmap)
        console.log('Current ymap:  ', yMap)
        console.log('Expected ymap: ', randomObject)
      }
      expect(yMap.toJSON()).toEqual(randomObject)
    })
  })

  it('patchType and patch work the same way', () => {
    const yMap = utils.makeYMap()
    const redux = {}
    _.range(0, 10000).forEach((none, index) => {
      const copyRedux = _.cloneDeep(redux)
      const randomObject = Object.freeze(utils.generateObject())
      const expectedState = _.cloneDeep(randomObject)

      tryPatchYType(yMap, randomObject)

      deepPatchJson(redux, yMap.toJSON())

      if (!_.isEqual(redux, expectedState)) {
        console.log(`MISMATCH at index ${index}`)
        console.log('Previous redux:      ', copyRedux)
        console.log('Current redux:       ', redux)
        console.log('Expected Redux state:', expectedState)
        console.log('Current ymap:        ', yMap.toJSON())
      }
      expect(redux).toEqual(expectedState)
    })
  })

  // This is a generated test case that previously caused issues
  it('handles complex array deletions', () => {
    const current = { '0': [[1]] }

    const expected = { '0': { '0': [{}] } }

    const yMap = utils.makeYMap()
    tryPatchYType(yMap, current)

    tryPatchYType(yMap, expected)

    expect(yMap.toJSON()).toEqual(expected)
  })
})
