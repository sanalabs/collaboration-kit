import { create, Delta } from 'jsondiffpatch'
import _ from 'lodash'
import * as Y from 'yjs'
import { assertIsString, isPlainArray, isPlainObject } from '../../../json/src'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray } from '../assertions'
import { toYType } from '../y-utils'

// Handling moves in yjs types is too difficult at the moment.
// We may revisit this in the future.
const jsonPatcher = create({ arrays: { detectMove: false }, textDiff: { minLength: undefined } })
export const diff = jsonPatcher.diff.bind(jsonPatcher)

type ArrayDelta = { _t: 'a'; [unit: string]: unknown }
const isArrayDelta = (d: Delta): d is ArrayDelta => d._t === 'a'

type ObjectDelta = Omit<{ [unit: string]: unknown }, '_t'>

type Insert = [newValue: unknown]
const isInsertion = (operation: unknown): operation is Insert =>
  isPlainArray(operation) && operation.length === 1

type Delete = unknown[]
const isDeletion = (operation: unknown): operation is Delete => {
  if (!isPlainArray(operation)) return false
  const [, second, third] = operation
  return second === 0 && third === 0
}

type UnidiffUpdate = [unidiff: string, ignore: 0, ignore: 0]
const isUnidiffUpdate = (operation: unknown): operation is UnidiffUpdate =>
  isPlainArray(operation) && operation.length === 3 && operation[2] === 2

type Update = [oldValue: unknown, newValue: unknown] | UnidiffUpdate
const isUpdate = (operation: unknown): operation is Update => {
  if (!isPlainArray(operation)) return false

  // Simple update
  if (operation.length === 2) return true

  // Text diff: https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md#text-diffs
  if (isUnidiffUpdate(operation)) return true

  return false
}

const newValueFromUpdate = (existingValue: unknown, update: Update): YType => {
  if (isUnidiffUpdate(update)) {
    assertIsString(existingValue)

    // jsondiffpatch gives us a unidiff update for long strings. We do not have a
    // way to deal with these diffs, so we call into jsondiffpatch to apply the diffs
    const obj = { string: existingValue }
    jsonPatcher.patch(obj, { string: update })

    return obj.string
  }
  const [, newValue] = update
  return toYType(newValue)
}

type NestedUpdate = Delta
const isNestedDelta = (operation: unknown): operation is NestedUpdate =>
  isPlainObject(operation) && !isPlainArray(operation)

type YType = ReturnType<typeof toYType>

const arrayOperations = (
  delta: ArrayDelta,
): {
  insertions: [index: number, value: YType][]
  deletions: number[]
  updates: [index: number, update: Update][]
  nestedUpdates: [index: number, nestedDelta: NestedUpdate][]
} => {
  const entries = _.chain(delta)
    .omit(['_t'])
    .entries()
    .sortBy(([key]) => key)
    .map(([key, operation]): [number, unknown] => [parseInt(key.replace('_', '')), operation])
    .value()

  return {
    insertions: entries.flatMap(([key, operation]) =>
      isInsertion(operation) ? [[key, toYType(operation[0])]] : [],
    ),
    deletions: entries
      .flatMap(([key, operation]) => (isDeletion(operation) ? [key] : []))
      // Delete indices are relative to the original array. By traversing them in
      // reverse order we do not need to worry about deletes at a lower index value
      // affecting the indices of deletes at larger index values.
      .reverse(),
    updates: entries.flatMap(([key, operation]) => (isUpdate(operation) ? [[key, operation]] : [])),
    nestedUpdates: entries.flatMap(([key, nestedDelta]) =>
      isNestedDelta(nestedDelta) ? [[key, nestedDelta]] : [],
    ),
  }
}

const objectOperations = (
  delta: ObjectDelta,
): {
  insertions: [key: string, value: YType][]
  deletions: string[]
  updates: [key: string, update: Update][]
  nestedUpdates: [key: string, nestedDelta: NestedUpdate][]
} => {
  const entries = _.chain(delta)
    .omit(['_t'])
    .entries()
    .sortBy(([key]) => key)
    .value()

  return {
    insertions: entries.flatMap(([key, operation]) =>
      isInsertion(operation) ? [[key, toYType(operation[0])]] : [],
    ),
    deletions: entries.flatMap(([key, operation]) => (isDeletion(operation) ? [key] : [])),
    updates: entries.flatMap(([key, operation]) => (isUpdate(operation) ? [[key, operation]] : [])),
    nestedUpdates: entries.flatMap(([key, nestedDelta]) =>
      isNestedDelta(nestedDelta) ? [[key, nestedDelta]] : [],
    ),
  }
}

export function patch(yType: Y.Map<unknown> | Y.Array<unknown>, delta: Delta): void {
  if (isArrayDelta(delta)) {
    assertIsYArray(yType)

    const { deletions, insertions, updates, nestedUpdates } = arrayOperations(delta)

    for (const index of deletions) {
      yType.delete(index, 1)
    }

    for (const [index, newYType] of insertions) {
      yType.insert(index, [newYType])
    }

    for (const [index, update] of updates) {
      const existingValue = yType.get(index)
      yType.delete(index, 1)
      yType.insert(index, [newValueFromUpdate(existingValue, update)])
    }

    for (const [index, innerDelta] of nestedUpdates) {
      const innerYType = yType.get(index)
      assertIsYMapOrArray(innerYType, index)
      patch(innerYType, innerDelta)
    }
  } else {
    assertIsYMap(yType)

    const { deletions, insertions, updates, nestedUpdates } = objectOperations(delta)

    for (const key of deletions) {
      yType.delete(key)
    }

    for (const [key, newYType] of insertions) {
      yType.set(key, newYType)
    }

    for (const [key, update] of updates) {
      const existingValue = yType.get(key)
      yType.set(key, newValueFromUpdate(existingValue, update))
    }

    for (const [key, nestedDelta] of nestedUpdates) {
      const innerYType = yType.get(key)
      assertIsYMapOrArray(innerYType, key)
      patch(innerYType, nestedDelta)
    }
  }
}
