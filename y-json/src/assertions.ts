import * as Y from 'yjs'
import { mkErr } from '../../json/src'

export function isYArray(val: unknown): val is Y.Array<unknown> {
  return val instanceof Y.Array
}

export function isYMap(val: unknown): val is Y.Map<unknown> {
  return val instanceof Y.Map
}

export function assertIsYMapOrArray(
  val: unknown,
  property: string | number,
): asserts val is Y.Map<unknown> | Y.Array<unknown> {
  if (val instanceof Y.Map) return
  if (val instanceof Y.Map) return
  if (val instanceof Y.Array) return
  throw mkErr(val, `Y.Map or Y.Array at property ${property}`)
}
