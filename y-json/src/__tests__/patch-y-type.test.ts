import * as Y from 'yjs'
import { isYArray, isYMap } from '../assertions'
import { patchYType } from '../patch-y-type'

const makeDoc = (): Y.Doc => new Y.Doc()

const makeYMap = (): Y.Map<unknown> => makeDoc().getMap('test-map')

const makeYArray = (): Y.Array<unknown> => makeDoc().getArray('test-array')

describe('patchYType tests', () => {
  it('can add fields to an empty map', () => {
    const expectedResult = { hello: 'world' }
    const yMap = makeYMap()

    patchYType(yMap, expectedResult)

    expect(yMap.toJSON()).toEqual(expectedResult)
  })

  it('will mutate itself to resemble the last object that was patched ', () => {
    const yMap = makeYMap()

    const oldData = { a: { a: true }, b: { a: true, b: true } }
    const newData = { b: { a: false, b: true } }

    patchYType(yMap, oldData)
    patchYType(yMap, newData)

    expect(yMap.toJSON()).toEqual(newData)
  })

  it('can patch one array', () => {
    const array = [1, 2, 4]
    const yArray = makeYArray()

    patchYType(yArray, array)
    expect(yArray.toJSON()).toEqual([1, 2, 4])
  })

  it('can patch the differences between two arrays', () => {
    const oldArray = [1, 2, 4]
    const newArray = [1, 2, 3]

    const yArray = makeYArray()

    patchYType(yArray, oldArray)
    patchYType(yArray, newArray)

    expect(yArray.toJSON()).toEqual(newArray)
  })

  it('can patch the differences between objects containing arrays', () => {
    const oldObject = { arr: [1, 2, 4] }
    const newObject = { arr: [1, 2, 3] }

    const yMap = makeYMap()

    patchYType(yMap, oldObject)
    patchYType(yMap, newObject)

    expect(yMap.toJSON()).toEqual(newObject)
  })

  it('uses `Y.Map`s to represent nested maps', () => {
    const yMap = makeYMap()
    const data = { a: { a: true } }

    patchYType(yMap, data)

    if (!isYMap(yMap.get('a'))) fail(`Expected yMap.a to be a yMap. Got: ${JSON.stringify(yMap.get('a'))}`)
  })

  it('uses `Y.Array`s to represent nested arrays', () => {
    const object = { arr: [1, 2, 4] }

    const yMap = makeYMap()

    patchYType(yMap, object)

    const arr = yMap.get('arr')
    if (!isYArray(arr)) fail(`Expected \`arr\` to be a \`Y.Array\`, got ${JSON.stringify(arr)}`)
  })
})
