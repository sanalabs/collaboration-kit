import {
  assertIsPlainArray,
  assertIsPlainObject,
  isPlainArray,
  isPlainObject,
  Json,
  JsonArray,
  JsonObject,
  JsonPrimitive,
} from '.'
import { mkErr } from './error'

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

export function assertIsJsonArray(val: unknown): asserts val is JsonArray {
  assertIsPlainArray(val)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  val.forEach(assertIsJson)
}

export function assertIsJsonObject(val: unknown): asserts val is JsonObject {
  assertIsPlainObject(val)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  Object.values(val).forEach(assertIsJson)
}

export function assertIsJson(val: unknown): asserts val is Json {
  if (isPlainObject(val)) {
    assertIsJsonObject(val)
  } else if (isPlainArray(val)) {
    assertIsJsonArray(val)
  } else {
    assertIsJsonPrimitive(val)
  }
}
