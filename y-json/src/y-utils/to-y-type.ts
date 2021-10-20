/* eslint-disable @typescript-eslint/no-use-before-define */
import * as Y from 'yjs'
import { assertIsJsonPrimitive, assertIsPlainObject } from '../../../json/src'
import { isPlainObject } from '../assertions'
import { isValidArray, isValidObject, ValidValue } from '../valid-value'

const objectToYMap = (object: Record<string, unknown>): Y.Map<unknown> => {
  const yMap = new Y.Map()

  assertIsPlainObject(object)
  Object.entries(object).forEach(([property, val]) => {
    if (Array.isArray(val)) {
      yMap.set(property, arrayToYArray(val))
    } else if (isPlainObject(val)) {
      yMap.set(property, objectToYMap(val))
    } else {
      assertIsJsonPrimitive(val)
      yMap.set(property, val)
    }
  })

  return yMap
}

const arrayToYArray = (array: unknown[]): Y.Array<unknown> => {
  const yArray = new Y.Array()

  array.forEach(val => {
    if (Array.isArray(val)) {
      yArray.push([arrayToYArray(val)])
    } else if (isPlainObject(val)) {
      yArray.push([objectToYMap(val)])
    } else {
      assertIsJsonPrimitive(val)
      yArray.push([val])
    }
  })

  return yArray
}

export function toYType(
  value: ValidValue,
): Y.Map<unknown> | Y.Array<unknown> | string | number | boolean | null {
  if (value === null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (isValidArray(value)) arrayToYArray(value)
  if (isValidObject(value)) throw new Error('TODO')

  throw new Error(`Unsupported type. Type: ${typeof value}, value ${JSON.stringify(value)}`)
}
