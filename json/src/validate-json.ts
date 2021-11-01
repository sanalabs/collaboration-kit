import { isPlainArray, isPlainObject } from '.'
import { mkErr } from './error'

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [key: string]: Json }
export type JsonArray = Json[]
export type JsonContainer = JsonObject | JsonArray
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

export function assertIsJson(val: unknown): asserts val is Json {
  if (isPlainObject(val)) {
    Object.values(val).forEach(assertIsJson)
  } else if (isPlainArray(val)) {
    val.forEach(assertIsJson)
  } else {
    assertIsJsonPrimitive(val)
  }
}
