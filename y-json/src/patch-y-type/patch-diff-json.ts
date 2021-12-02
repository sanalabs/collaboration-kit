import _ from 'lodash'
import * as Y from 'yjs'
import { isPlainArray, isPlainObject } from '../../../json/src'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray, YJson } from '../assertions'
import { unknownToYTypeOrPrimitive } from '../y-utils'
import { hash } from './hash'
import { longestCommonSubsequence } from './lcs'

export interface Delta {
  [key: string]: any
  [key: number]: any
}

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
    .map(([key, operation]): [number, unknown] => [parseInt(key.replace('_', '')), operation])
    .sortBy(([key]) => key)
    .value()

  return {
    insertions: _.flatMap(entries, ([key, operation]) =>
      isInsertion(operation) ? [[key, unknownToYTypeOrPrimitive(operation[0])]] : [],
    ),
    deletions: _.flatMap(entries, ([key, operation]) => (isDeletion(operation) ? [key] : []))
      // Delete indices are relative to the original array. By traversing them in
      // reverse order we do not need to worry about deletes at a lower index value
      // affecting the indices of deletes at larger index values.
      .reverse(),
    updates: _.flatMap(entries, ([key, operation]) =>
      isUpdate(operation) ? [[key, unknownToYTypeOrPrimitive(operation[1])]] : [],
    ),
    nestedUpdates: _.flatMap(entries, ([key, nestedDelta]) =>
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
  const entries = _.entries(delta)

  return {
    insertions: _.flatMap(entries, ([key, operation]) =>
      isInsertion(operation) ? [[key, unknownToYTypeOrPrimitive(operation[0])]] : [],
    ),
    deletions: _.flatMap(entries, ([key, operation]) => (isDeletion(operation) ? [key] : [])),
    updates: _.flatMap(entries, ([key, operation]) =>
      isUpdate(operation) ? [[key, unknownToYTypeOrPrimitive(operation[1])]] : [],
    ),
    nestedUpdates: _.flatMap(entries, ([key, nestedDelta]) =>
      isNestedDelta(nestedDelta) ? [[key, nestedDelta]] : [],
    ),
  }
}

export function diff(
  oldState: unknown[] | Record<string, unknown>,
  newState: unknown[] | Record<string, unknown>,
  objectHashes?: Map<object | number | string | boolean, number>,
): Delta | undefined {
  if (newState === oldState) {
    return
  }
  if (objectHashes === undefined) {
    objectHashes = new Map()
  }
  if (Array.isArray(oldState)) {
    if (!Array.isArray(newState)) {
      throw new Error('Expected new state to be an Array because old state is an array')
    }
    const lcs = longestCommonSubsequence(oldState, newState, objectHashes)
    const result: ArrayDelta = { _t: 'a' }

    let oldIdx = 0,
      newIdx = 0,
      lcsIdx = 0
    while (oldIdx < oldState.length || newIdx < newState.length) {
      if (oldIdx === oldState.length) {
        result[newIdx] = [newState[newIdx]]
        newIdx++
        continue
      } else if (newIdx === newState.length) {
        result[`_${oldIdx}`] = [oldState[oldIdx], 0, 0]
        oldIdx++
        continue
      }
      const oldValue = oldState[oldIdx]
      const newValue = newState[newIdx]
      const lcsHash = lcsIdx < lcs.length ? hash(lcs[lcsIdx], objectHashes) : undefined
      const oldValueMatchesLcsValue = hash(oldValue, objectHashes) === lcsHash
      const newValueMatchesLcsValue = hash(newValue, objectHashes) === lcsHash
      if (newValueMatchesLcsValue && !oldValueMatchesLcsValue) {
        result[`_${oldIdx}`] = [oldState[oldIdx], 0, 0]
        oldIdx++
      } else if (oldValueMatchesLcsValue && !newValueMatchesLcsValue) {
        result[newIdx] = [newState[newIdx]]
        newIdx++
      } else {
        if (oldValue !== newValue) {
          const areValuesSameType =
            (isPlainArray(oldValue) && isPlainArray(newValue)) ||
            (isPlainObject(oldValue) && isPlainObject(newValue))
          const isOldValueDiffable = isPlainArray(oldValue) || isPlainObject(oldValue)
          const isNewValueDiffable = isPlainArray(newValue) || isPlainObject(newValue)
          if (areValuesSameType && isOldValueDiffable && isNewValueDiffable) {
            const childDiff = diff(oldValue, newValue, objectHashes)
            result[newIdx] = childDiff
          } else {
            result[newIdx] = [oldValue, newValue]
          }
        }
        oldIdx++
        newIdx++
        lcsIdx++
      }
    }
    return result
  }
  if (Array.isArray(newState)) {
    throw new Error('Expected new state not to be an Array because old state is not an array')
  }
  const result: ObjectDelta = {}
  for (const key in oldState) {
    const oldVal = oldState[key]
    const newVal = newState[key]
    if (newVal === undefined) {
      result[key] = [oldVal, 0, 0]
      continue
    }
    const areValuesSameType =
      (isPlainArray(oldVal) && isPlainArray(newVal)) || (isPlainObject(oldVal) && isPlainObject(newVal))
    const isOldValDiffable = isPlainArray(oldVal) || isPlainObject(oldVal)
    const isNewValDiffable = isPlainArray(newVal) || isPlainObject(newVal)
    if (areValuesSameType && isOldValDiffable && isNewValDiffable) {
      const childDiff = diff(oldVal, newVal, objectHashes)
      result[key] = childDiff
    } else {
      result[key] = [oldVal, newVal]
    }
  }
  for (const key in newState) {
    const oldVal = oldState[key]
    const newVal = newState[key]
    if (oldVal === undefined) {
      result[key] = [newVal]
    }
  }
  return result
}

export function patch(yType: Y.Map<unknown> | Y.Array<unknown>, delta: Delta): void {
  if (isArrayDelta(delta)) {
    assertIsYArray(yType)

    const { deletions, insertions, updates, nestedUpdates } = arrayOperations(delta)

    for (let i = 0; i < deletions.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const blockHi = deletions[i]!
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      while (i < deletions.length - 1 && deletions[i + 1] === deletions[i]! - 1) i++
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const blockLo = deletions[i]!
      yType.delete(blockLo, blockHi - blockLo + 1)
    }

    for (let i = 0; i < insertions.length; i++) {
      const block: YJson[] = []
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [blockLo, element] = insertions[i]!
      let blockHi = blockLo
      block.push(element)
      while (i < insertions.length - 1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [idx, element] = insertions[i + 1]!
        if (idx !== blockHi + 1) {
          break
        }
        blockHi = idx
        block.push(element)
        i++
      }
      yType.insert(blockLo, block)
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
