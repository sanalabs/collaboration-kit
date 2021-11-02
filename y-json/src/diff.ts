/* eslint-disable @typescript-eslint/no-use-before-define */
import _, { isArray } from 'lodash'
import {
  assertIsJson,
  isPlainArray,
  isPlainObject,
  Json,
  JsonArray,
  JsonContainer,
  JsonObject,
} from '../../json/src'

type Delete = { type: 'delete'; key: string }
type Nest = { type: 'nest'; key: string; diffs: Diff[] }
type Upsert = { type: 'upsert'; key: string; value: Json }
type ArrayUpsert = { type: 'array-upsert'; index: number; value: Json }
type ArrayDelete = { type: 'array-delete'; index: number }
type ArrayNest = { type: 'array-nest'; key: string; diffs: (ArrayUpsert | ArrayDelete)[] }
export type Diff = Delete | Upsert | Nest | ArrayUpsert | ArrayDelete | ArrayNest

function isObject(val: unknown): val is Record<string, unknown> {
  return val instanceof Object
}

function keySet(a: Readonly<Record<string, unknown>>): Readonly<Set<string>> {
  return new Set(Object.keys(a))
}

function diffArray(a: unknown, b: Readonly<JsonArray>): (ArrayDelete | ArrayUpsert)[] {
  const oldArray = Array.isArray(a) ? a : ([] as const)

  let offset = 0
  const deletions: ArrayDelete[] = []
  const arrayWithDeletions = [...oldArray]
  oldArray.forEach((oldValue, index) => {
    const offsetIndex = index - offset
    const newValue = _.get(b, offsetIndex)

    if (!_.isEqual(oldValue, newValue)) {
      deletions.push({ type: 'array-delete', index: offsetIndex })
      arrayWithDeletions.splice(offsetIndex, 1)
      offset++
    }
  })

  const upserts: ArrayUpsert[] = []
  b.forEach((newValue, index) => {
    const oldValue: unknown = _.get(arrayWithDeletions, index)

    if (!_.isEqual(oldValue, newValue)) {
      upserts.push({ type: 'array-upsert', index, value: newValue })
    }
  })

  return [...deletions, ...upserts]
}

/**
 * Get the value of a key in an object. Unlike `_.get`, this function explicitly does not operate on arrays.
 */
function objGet(obj: unknown, key: string): unknown {
  if (isObject(obj) && !isArray(obj)) return _.get(obj, key)
  return undefined
}

function diffObject(a: unknown, b: Readonly<JsonObject>): (Delete | Nest | Upsert | ArrayNest)[] {
  const aKeys = isObject(a) ? keySet(a) : new Set<string>()
  const bKeys = keySet(b)

  const deletions: Delete[] = [...aKeys].filter(key => !bKeys.has(key)).map(key => ({ type: 'delete', key }))

  const nestsAndUpserts: (Upsert | Nest | ArrayNest)[] = Object.entries(b)
    // Find all the key/value pairs that have changed
    .filter(([key, value]) => !_.isEqual(objGet(a, key), value))
    // Map the changes into upserts of nestings
    .map(([key, value]) => {
      assertIsJson(value)
      if (isArray(value)) return { type: 'array-nest', key, diffs: diffArray(objGet(a, key), value) }
      if (isObject(value)) return { type: 'nest', key, diffs: innerDiff(objGet(a, key), value) }
      return { type: 'upsert', key, value }
    })

  return [...deletions, ...nestsAndUpserts]
}

function innerDiff(a: unknown, b: Readonly<JsonContainer>): Diff[] {
  if (isPlainArray(b)) return diffArray(a, b as Readonly<JsonArray>)
  if (isPlainObject(b)) return diffObject(a, b as Readonly<JsonObject>)

  throw new Error(`Expected an object or an array, got ${JSON.stringify(b)}`)
}

/**
 * Compute the operations required to turn `a` into `b`
 */
export function diff(a: unknown, b: Readonly<JsonObject>): Diff[]
export function diff(a: unknown, b: Readonly<JsonArray>): Diff[]
export function diff(a: unknown, b: Readonly<JsonContainer>): Diff[] {
  // Don't recurse this method, since it does a deep json assertion:
  assertIsJson(a)
  assertIsJson(b)
  return innerDiff(a, b)
}
