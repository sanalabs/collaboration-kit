/* eslint-disable @typescript-eslint/no-use-before-define */
import _, { isArray } from 'lodash'
import {
  assertIsValidValue,
  isValidArray,
  isValidObject,
  ValidArray,
  ValidObject,
  ValidValue,
} from './valid-value'

type Delete = { type: 'delete'; key: string }
type Nest = { type: 'nest'; key: string; diffs: Diff[] }
type Upsert = { type: 'upsert'; key: string; value: ValidValue }
type ArrayUpsert = { type: 'array-upsert'; index: number; value: ValidValue }
type ArrayDelete = { type: 'array-delete'; index: number }
type ArrayNest = { type: 'array-nest'; key: string; diffs: (ArrayUpsert | ArrayDelete)[] }
export type Diff = Delete | Upsert | Nest | ArrayUpsert | ArrayDelete | ArrayNest

const isObject = (val: unknown): val is Record<string, unknown> => val instanceof Object

const keySet = (a: Readonly<Record<string, unknown>>): Readonly<Set<string>> => new Set(Object.keys(a))

const diffArray = (a: unknown, b: Readonly<ValidArray>): (ArrayDelete | ArrayUpsert)[] => {
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

const diffObject = (a: unknown, b: Readonly<ValidObject>): (Delete | Nest | Upsert | ArrayNest)[] => {
  const aKeys = isObject(a) ? keySet(a) : new Set<string>()
  const bKeys = keySet(b)

  const deletions: Delete[] = [...aKeys].filter(key => !bKeys.has(key)).map(key => ({ type: 'delete', key }))
  const nestsAndUpserts: (Upsert | Nest | ArrayNest)[] = Object.entries(b)
    // Find all the key/value pairs that have changed
    .filter(([key, value]) => !_.isEqual(_.get(a, key), value))
    // Map the changes into upserts of nestings
    .map(([key, value]) => {
      assertIsValidValue(value)
      if (isArray(value)) return { type: 'array-nest', key, diffs: diffArray(_.get(a, key), value) }
      if (isObject(value)) return { type: 'nest', key, diffs: diff(_.get(a, key), value) }
      return { type: 'upsert', key, value }
    })

  return [...deletions, ...nestsAndUpserts]
}

/**
 * Compute the operations required to turn `a` into `b`
 */
export function diff(a: unknown, b: Readonly<ValidObject | ValidArray>): Diff[] {
  if (isValidArray(b)) return diffArray(a, b)
  if (isValidObject(b)) return diffObject(a, b)

  throw new Error(`Expected an object or an array, got ${JSON.stringify(b)}`)
}
