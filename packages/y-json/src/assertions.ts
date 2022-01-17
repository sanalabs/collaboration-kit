import { isJsonPrimitive } from '@sanalabs/json'
import * as Y from 'yjs'
import { mkErr } from './error'

export type YJson = Y.Map<YJson> | Y.Array<YJson> | string | number | boolean | null

export function isYArray(val: unknown): val is Y.Array<unknown> {
  return val instanceof Y.Array
}

export function isYMap(val: unknown): val is Y.Map<unknown> {
  return val instanceof Y.Map
}

export function assertIsYMap(val: unknown): asserts val is Y.Map<unknown> {
  if (val instanceof Y.Map) return
  throw mkErr(val, 'Y.Array')
}

export function assertIsYArray(val: unknown): asserts val is Y.Array<unknown> {
  if (val instanceof Y.Array) return
  throw mkErr(val, 'Y.Map')
}

export function assertIsYMapOrArray(
  val: unknown,
  property: string | number,
): asserts val is Y.Map<unknown> | Y.Array<unknown> {
  if (isYMap(val) || isYArray(val)) return
  throw mkErr(val, `Y.Map or Y.Array at property ${property}`)
}

export function assertIsYJson(yType: unknown): asserts yType is YJson {
  const recurse = (val: unknown, path: string): void => {
    if (val instanceof Y.Map) {
      for (const key of val.keys()) {
        recurse(val.get(key), `${path}.get('${key}')`)
      }
      return
    }

    if (val instanceof Y.Array) {
      const len = val.length
      for (let i = 0; i < len; i++) {
        recurse(val.get(i), `${path}.get(${i})`)
      }
      return
    }

    if (
      val instanceof Y.Text ||
      val instanceof Y.XmlFragment ||
      val instanceof Y.XmlElement ||
      val instanceof Y.XmlText
    ) {
      throw new Error(`assertIsYJson: Expected ${val.constructor.name} to be YMap or YArray at ${path}`)
    }

    if (!isJsonPrimitive(val)) {
      throw new Error(
        `assertIsYJson: Expected ${JSON.stringify(
          val,
        )} to be JSON primitive (string | number | boolean | null) at ${path}`,
      )
    }
  }

  recurse(yType, 'yType')
}
