import _ from 'lodash'
import { patchYType } from '..'
import { deepPatchJson } from '../../../../json/src'
import * as assertions from '../../assertions'
import * as utils from './utils'

const tryPatchYType: typeof patchYType = (yType, data) => {
  assertions.assertIsYMapOrArray(yType, '')
  const yTypeState: unknown = yType.toJSON()
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    patchYType(yType as any, data as any)
  } catch (e) {
    console.log(`Failed to patch`)
    console.log('State', JSON.stringify(yTypeState, null, 2))
    console.log('Expected State', JSON.stringify(data, null, 2))
    throw e
  }
}

describe('patchYType tests', () => {
  it('can add fields to an empty map', () => {
    const expectedResult = { hello: 'world' }
    const yMap = utils.makeYMap()
    patchYType(yMap, expectedResult)
    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('can remove fields from a map', () => {
    const startingState = { a: 1, b: 1 }
    const expectedResult = { b: 1 }
    const yMap = utils.makeYMap()
    patchYType(yMap, startingState)
    patchYType(yMap, expectedResult)
    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('can update fields of a map', () => {
    const startingState = { a: 1 }
    const expectedResult = { a: 2 }
    const yMap = utils.makeYMap()
    patchYType(yMap, startingState)
    patchYType(yMap, expectedResult)
    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('can set nested fields of a map', () => {
    const expectedResult = { a: { a: 1, b: 1 } }
    const yMap = utils.makeYMap()
    patchYType(yMap, expectedResult)
    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('can update nested fields of a map', () => {
    const startingState = { a: { a: 1, b: 1 } }
    const expectedResult = { a: { a: 1, b: 2 } }
    const yMap = utils.makeYMap()
    patchYType(yMap, startingState)
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

  it('can handle moves in arrays', () => {
    const oldArray = [1, 2, 3]
    const newArray = [1, 3, 2]
    const yArray = utils.makeYArray()
    patchYType(yArray, oldArray)
    patchYType(yArray, newArray)
    expect(yArray.toJSON()).toEqual(newArray)
  })

  it('can delete multiple elements from an array', () => {
    const startingState: number[] = [1, 1]
    const endState: number[] = []

    const yArray = utils.makeYArray()
    patchYType(yArray, startingState)
    patchYType(yArray, endState)
    expect(yArray.toJSON()).toEqual(endState)
  })

  it('can move and delete elements', () => {
    const startingState = [1, 2, 3]
    const expectedState = [3, 2]

    const yArray = utils.makeYArray()
    tryPatchYType(yArray, startingState)
    tryPatchYType(yArray, expectedState)
    expect(yArray.toJSON()).toEqual(expectedState)
  })

  it('can patch the differences between two arrays', () => {
    const oldArray = [1, 2, 4]
    const newArray = [1, 2, 3, 5]
    const yArray = utils.makeYArray()
    patchYType(yArray, oldArray)
    patchYType(yArray, newArray)
    expect(yArray.toJSON()).toEqual(newArray)
  })

  it('can handle arrays containing objects', () => {
    const oldArray = [{ a: 1 }]
    const newArray = [{ a: 2 }]
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
    assertions.assertIsYMap(yMap.get('a'))
  })

  it('uses `Y.Array`s to represent nested arrays', () => {
    const object = { arr: [1, 2, 4] }
    const yMap = utils.makeYMap()
    patchYType(yMap, object)
    const arr = yMap.get('arr')
    assertions.assertIsYArray(arr)
  })

  it('handles deeply chained mutations of ymaps', () => {
    const yMap = utils.makeYMap()
    _.range(0, 100000).forEach((none, index) => {
      const randomObject = Object.freeze(utils.generateObject())
      const copyYmap: unknown = yMap.toJSON()
      tryPatchYType(yMap, randomObject)

      if (!_.isEqual(yMap.toJSON(), randomObject)) {
        console.log(`MISMATCH at index ${index}`)
        console.log('Previous ymap: ', copyYmap)
        console.log('Current ymap:  ', yMap)
        console.log('Expected ymap: ', randomObject)
      }

      expect(yMap.toJSON()).toEqual(randomObject)
    })
  })

  it('patchYType and deepPatchJson work the same way', () => {
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

  it('handles generated test case 1', () => {
    const startingState = { '0': 2, '1': [3, 1, 3, 'acb', 3, false, 'adc'], '2': 1, '3': ['', 'acb'] }
    const expectedState = { '0': 2, '1': [3, '', 3, 1, 3, false, 'adc'], '2': 1, '3': ['', 'acb'] }

    const yMap = utils.makeYMap()
    tryPatchYType(yMap, startingState)
    tryPatchYType(yMap, expectedState)
    expect(yMap.toJSON()).toEqual(expectedState)
  })

  it('handles generated test case 2', () => {
    const startingState = {
      '0': ['acb', 0, ['adc'], 'acb', 4, 1, ['def', 'def', 0, 0]],
    }
    const expectedState = {
      '0': ['acb', ['adc'], 'acb', ['def', 'def', 0, 0], 4, 1, 0],
    }

    const yMap = utils.makeYMap()
    tryPatchYType(yMap, startingState)
    tryPatchYType(yMap, expectedState)
    expect(yMap.toJSON()).toEqual(expectedState)
  })

  it('handles generated test case 3', () => {
    const startingState = {
      '1': [{ '0': 0, '1': 1, '2': 0 }, 'def', 2, 1, 'acb', ['adc', false]],
    }

    const expectedState = { '1': ['acb', 3] }

    const yMap = utils.makeYMap()
    tryPatchYType(yMap, startingState)
    tryPatchYType(yMap, expectedState)
    expect(yMap.toJSON()).toEqual(expectedState)
  })

  it('handles generated test case 4', () => {
    const startingState = [{}]

    const expectedState = [[]]

    const yArray = utils.makeYArray()
    tryPatchYType(yArray, startingState)
    tryPatchYType(yArray, expectedState)
    expect(yArray.toJSON()).toEqual(expectedState)
  })

  it('handles generated test case 5', () => {
    const current = { '0': [[1]] }
    const expected = { '0': { '0': [{}] } }
    const yMap = utils.makeYMap()
    tryPatchYType(yMap, current)
    tryPatchYType(yMap, expected)
    expect(yMap.toJSON()).toEqual(expected)
  })
})
