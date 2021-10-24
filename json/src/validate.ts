import { mkErr } from './error'

export type JsonPrimitive = string | number | boolean | null
export type PlainObject = { [key: string]: Json }
export type PlainArray = Json[]
export type JsonContainer = PlainObject | PlainArray
export type Json = JsonPrimitive | JsonContainer

export function isJsonPrimitive(val: unknown): val is JsonPrimitive {
  if (typeof val === 'string') return true
  if (typeof val === 'number') return true
  if (typeof val === 'boolean') return true
  if (val === null) return true
  return false
}

export function assertIsJsonPrimitive(val: unknown): asserts val is JsonPrimitive {
  if (!isJsonPrimitive(val)) throw mkErr(val, 'JSON primitive (string | number | boolean | null)')
}

export function isJsonTemplatePrimitive(val: unknown): val is JsonPrimitive {
  if (isJsonPrimitive(val)) return true
  if (val === undefined) return true
  return false
}

export function assertIsJsonTemplatePrimitive(val: unknown): asserts val is JsonPrimitive {
  if (!isJsonTemplatePrimitive(val)) throw mkErr(val, 'JSON primitive (string | number | boolean | null)')
}

export function isPlainArray(val: unknown): val is PlainArray {
  return Array.isArray(val)
}

export function assertIsArray(val: unknown): asserts val is unknown[] {
  if (!isPlainArray(val)) throw mkErr(val, 'array')
}

// Based on https://github.com/lodash/lodash/blob/master/isPlainObject.js
export function isPlainObject(val: unknown): val is PlainObject {
  if (typeof val !== 'object') return false
  if (val === null) return false
  if (Object.prototype.toString.call(val) !== '[object Object]') return false

  let proto: unknown = val
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  return Object.getPrototypeOf(val) === proto
}

export function assertIsPlainObject(val: unknown): asserts val is PlainObject {
  if (!isPlainObject(val)) throw mkErr(val, 'plain object')
}

export function isJsonContainer(val: unknown): val is JsonContainer {
  return isPlainObject(val) || isPlainArray(val)
}

export function assertIsJsonContainer(val: unknown): asserts val is Record<string, unknown> | unknown[] {
  if (!isJsonContainer(val)) throw mkErr(val, 'plain object or array')
}

export function assertIsJson(val: unknown): asserts val is Json {
  if (isPlainObject(val)) {
    Object.values(val).forEach(assertIsJson)
  } else if (isPlainArray(val)) {
    val.forEach(assertIsJson)
  } else {
    assertIsJsonPrimitive(val)
  }
}

export function assertIsJsonTemplate(val: unknown): asserts val is Json {
  if (isPlainObject(val)) {
    Object.values(val).forEach(assertIsJsonTemplate)
  } else if (isPlainArray(val)) {
    val.forEach(assertIsJsonTemplate)
  } else {
    assertIsJsonTemplatePrimitive(val)
  }
}

// Remove undefined from objects and replace undefined with null in arrays
export function normalizeJson(val: PlainObject | PlainArray): void {
  assertIsJsonContainer(val)
  if (isPlainObject(val)) {
    for (const key in val) {
      const innerVal = val[key]
      if (innerVal === undefined) {
        delete val[key]
      } else if (isJsonContainer(innerVal)) {
        normalizeJson(innerVal)
      } else {
        assertIsJsonPrimitive(val)
      }
    }
  } else if (isPlainArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const innerVal = val[i]
      if (innerVal === undefined) {
        val[i] = null
      } else if (isJsonContainer(innerVal)) {
        normalizeJson(innerVal)
      } else {
        assertIsJsonPrimitive(val)
      }
    }
  } else {
    throw new Error('Unreachable')
  }
}
