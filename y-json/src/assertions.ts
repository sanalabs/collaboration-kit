import _ from 'lodash'
import * as Y from 'yjs'
import { mkErr } from '../../json/src'

export function isYArray(val: unknown): val is Y.Array<unknown> {
  return val instanceof Y.Array
}

export function isYMap(val: unknown): val is Y.Map<unknown> {
  return val instanceof Y.Map
}

export function assertIsYMap(val: unknown): asserts val is Y.Map<unknown> {
  if (val instanceof Y.Map) return
  throw mkErr(val, `Expected Y.Array, got: ${JSON.stringify(val)}`)
}

export function assertIsYArray(val: unknown): asserts val is Y.Array<unknown> {
  if (val instanceof Y.Array) return
  throw mkErr(val, `Expected Y.Map, got: ${JSON.stringify(val)}`)
}

export function assertIsYMapOrArray(
  val: unknown,
  property: string | number,
): asserts val is Y.Map<unknown> | Y.Array<unknown> {
  if (isYMap(val) || isYArray(val)) return
  throw mkErr(val, `Y.Map or Y.Array at property ${property}`)
}

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return _.isPlainObject(val)
}
