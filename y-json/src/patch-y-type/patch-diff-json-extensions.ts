import { create, Delta } from 'jsondiffpatch'
import _ from 'lodash'
import * as Y from 'yjs'
import { isPlainArray, isPlainObject } from '../../../json/src'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray } from '../assertions'
import { unknownToYTypeOrPrimitive } from '../y-utils'

// Handling moves in yjs types is too difficult at the moment.
// We may revisit this in the future.
const jsonPatcher = create({
  arrays: { detectMove: false },
  textDiff: {
    // We do not want the default text diffs generated by jsondiffpatch.
    // Disabling this does not seem to be possible, so we will use MAX_SAFE_INTEGER for now.
    minLength: Number.MAX_SAFE_INTEGER,
  },
})
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

type Update = [oldValue: unknown, newValue: unknown]
const isUpdate = (operation: unknown): operation is Update =>
  isPlainArray(operation) && operation.length === 2

type NestedUpdate = Delta
const isNestedDelta = (operation: unknown): operation is NestedUpdate =>
  isPlainObject(operation) && !isPlainArray(operation)

type YType = ReturnType<typeof unknownToYTypeOrPrimitive>

const arrayOperations = (
  delta: ArrayDelta,
): {
  insertions: [index: number, value: YType][]
  deletions: number[]
  updates: [index: number, newYType: YType][]
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
      isInsertion(operation) ? [[key, unknownToYTypeOrPrimitive(operation[0])]] : [],
    ),
    deletions: entries
      .flatMap(([key, operation]) => (isDeletion(operation) ? [key] : []))
      // Delete indices are relative to the original array. By traversing them in
      // reverse order we do not need to worry about deletes at a lower index value
      // affecting the indices of deletes at larger index values.
      .reverse(),
    updates: entries.flatMap(([key, operation]) =>
      isUpdate(operation) ? [[key, unknownToYTypeOrPrimitive(operation[1])]] : [],
    ),
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
  updates: [key: string, newYType: YType][]
  nestedUpdates: [key: string, nestedDelta: NestedUpdate][]
} => {
  const entries = _.chain(delta)
    .entries()
    .sortBy(([key]) => key)
    .value()

  return {
    insertions: entries.flatMap(([key, operation]) =>
      isInsertion(operation) ? [[key, unknownToYTypeOrPrimitive(operation[0])]] : [],
    ),
    deletions: entries.flatMap(([key, operation]) => (isDeletion(operation) ? [key] : [])),
    updates: entries.flatMap(([key, operation]) =>
      isUpdate(operation) ? [[key, unknownToYTypeOrPrimitive(operation[1])]] : [],
    ),
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

    for (const [index, newYType] of updates) {
      yType.delete(index, 1)
      yType.insert(index, [newYType])
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

    for (const [key, newYType] of updates) {
      yType.set(key, newYType)
    }

    for (const [key, nestedDelta] of nestedUpdates) {
      const innerYType = yType.get(key)
      assertIsYMapOrArray(innerYType, key)
      patch(innerYType, nestedDelta)
    }
  }
}
