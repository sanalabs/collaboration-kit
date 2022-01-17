import { PlainArray, PlainContainer, PlainObject } from '.'

function mkErr(val: unknown, type: string): Error {
  return new Error(`Expected ${JSON.stringify(val)} to be ${type}`)
}

export function isPlainArray(val: unknown): val is PlainArray {
  return Array.isArray(val)
}

export function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') throw mkErr(val, 'string')
}

export function assertIsPlainArray(val: unknown): asserts val is PlainArray {
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

export function isPlainContainer(val: unknown): val is PlainContainer {
  return isPlainObject(val) || isPlainArray(val)
}

export function assertIsPlainContainer(val: unknown): asserts val is PlainContainer {
  if (!isPlainContainer(val)) throw mkErr(val, 'plain object or array')
}
