import { applyPatch, compare } from 'fast-json-patch'
import _ from 'lodash'
import * as Y from 'yjs'

export type RandomArr = RandomValue[]
export type RandomPrimitive = string | number | boolean
export type RandomValue = RandomPrimitive | RandomArr | RandomObj
export type RandomObj = { [key: string]: RandomValue }

// eslint-disable-next-line @typescript-eslint/no-use-before-define
const generateArray = (): RandomArr => _.range(0, _.random(0, 10, false)).map(() => generateValue())

const generatePrimitive = (): RandomPrimitive => {
  const index = _.random(0, 2, false)
  switch (index) {
    case 0:
      return 1
    case 1:
      return 'two'
    default:
      return false
  }
}

export const generateValue = (): RandomValue => {
  const index = _.random(0, 25, false)
  if (index < 2) {
    return generateArray()
  } else if (index < 5) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return generateObject()
  }
  return generatePrimitive()
}

export const generateObject = (): RandomObj => {
  const entries: [string, RandomValue][] = _.range(0, _.random(0, 5, false)).map((it, index) => {
    return [`${index}`, generateValue()]
  })
  return Object.fromEntries(entries)
}

export function patch<T extends Record<string, unknown> | Array<unknown>>(
  objectToMutate: T,
  newState: T,
): void {
  applyPatch(objectToMutate, compare(objectToMutate, newState))
}

export const makeDoc = (): Y.Doc => new Y.Doc()

export const makeYMap = (): Y.Map<unknown> => makeDoc().getMap('test-map')

export const makeYArray = (): Y.Array<unknown> => makeDoc().getArray('test-array')
