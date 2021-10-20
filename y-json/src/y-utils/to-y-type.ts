/* eslint-disable @typescript-eslint/no-use-before-define */
import * as Y from 'yjs'
import {
  assertIsJsonPrimitive,
  assertIsPlainObject,
  isJsonPrimitive,
  isPlainArray,
  isPlainObject,
  Json,
} from '../../../json/src/validate'

function objectToYMap(object: Record<string, unknown>): Y.Map<unknown> {
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

function arrayToYArray(array: unknown[]): Y.Array<unknown> {
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

export function toYType(value: Json): Y.Map<unknown> | Y.Array<unknown> | string | number | boolean | null {
  if (isJsonPrimitive(value)) return value
  if (isPlainArray(value)) arrayToYArray(value)
  if (isPlainObject(value)) throw new Error('TODO')

  throw new Error(`Unsupported type. Type: ${typeof value}, value ${JSON.stringify(value)}`)
}
