import { hash } from './hash'
import { longestCommonSubsequence } from './lcs'
import { isPlainArray, isPlainObject } from './type-guards-plain'

export enum OperationType {
  Insertion = 'insert',
  Deletion = 'delete',
  Substitution = 'substitute',
  Nested = 'nested',
}

interface ArrayInsertion {
  operationType: OperationType.Insertion
  index: number
  values: unknown[]
}
interface ArrayDeletion {
  operationType: OperationType.Deletion
  index: number
  count: number
}
interface ArraySubstitution {
  operationType: OperationType.Substitution
  index: number
  value: unknown
}
interface ArrayNestedDelta {
  operationType: OperationType.Nested
  index: number
  delta: Delta
}
interface ObjectInsertion {
  operationType: OperationType.Insertion
  key: string
  value: unknown
}
interface ObjectDeletion {
  operationType: OperationType.Deletion
  key: string
}
interface ObjectSubstitution {
  operationType: OperationType.Substitution
  key: string
  value: unknown
}
interface ObjectNestedDelta {
  operationType: OperationType.Nested
  key: string
  delta: Delta
}

export type ArrayOperation = ArrayInsertion | ArrayDeletion | ArraySubstitution | ArrayNestedDelta
export type ObjectOperation = ObjectInsertion | ObjectDeletion | ObjectSubstitution | ObjectNestedDelta

export enum DeltaType {
  Array = 'array',
  Object = 'object',
}

export interface ArrayDelta {
  type: DeltaType.Array
  operations: ArrayOperation[]
}

export interface ObjectDelta {
  type: DeltaType.Object
  operations: ObjectOperation[]
}

export type Delta = ArrayDelta | ObjectDelta

function compressInsertionOperations(insertionOperations: ArrayInsertion[]): ArrayInsertion[] {
  const compressedInsertionOperations: ArrayInsertion[] = []
  for (let i = 0; i < insertionOperations.length; i++) {
    const compressedOperation: ArrayInsertion = {
      operationType: OperationType.Insertion,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      index: insertionOperations[i]!.index,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      values: insertionOperations[i]!.values,
    }
    while (i < insertionOperations.length - 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const operation = insertionOperations[i + 1]!
      if (operation.index !== compressedOperation.index + compressedOperation.values.length) {
        break
      }
      compressedOperation.values.push(...operation.values)
      i++
    }
    compressedInsertionOperations.push(compressedOperation)
  }
  return compressedInsertionOperations
}

function compressDeletionOperations(deletionOperations: ArrayDeletion[]): ArrayDeletion[] {
  const compressedDeletionOperations: ArrayDeletion[] = []
  for (let i = 0; i < deletionOperations.length; i++) {
    const compressedOperation: ArrayDeletion = {
      operationType: OperationType.Deletion,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      index: deletionOperations[i]!.index,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      count: deletionOperations[i]!.count,
    }
    while (i < deletionOperations.length - 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const operation = deletionOperations[i + 1]!
      if (operation.index !== compressedOperation.index + compressedOperation.count) {
        break
      }
      compressedOperation.count += operation.count
      i++
    }
    compressedDeletionOperations.push(compressedOperation)
  }
  return compressedDeletionOperations
}

type diff = (
  oldState: unknown[] | Record<string, unknown>,
  newState: unknown[] | Record<string, unknown>,
  objectHashes?: Map<object | number | string | boolean, number>,
) => Delta

function diffArrays(
  oldState: unknown[],
  newState: unknown[],
  objectHashes: Map<object | number | string | boolean, number>,
): ArrayDelta {
  const lcs = longestCommonSubsequence(oldState, newState, objectHashes)
  const deletionOperations: ArrayDeletion[] = []
  const insertionOperations: ArrayInsertion[] = []
  const substitutionOperations: ArraySubstitution[] = []
  const nestedOperations: ArrayNestedDelta[] = []

  let oldIdx = 0,
    newIdx = 0,
    lcsIdx = 0
  while (oldIdx < oldState.length || newIdx < newState.length) {
    if (oldIdx === oldState.length) {
      insertionOperations.push({
        operationType: OperationType.Insertion,
        index: newIdx,
        values: newState.slice(newIdx),
      })
      break
    } else if (newIdx === newState.length) {
      deletionOperations.push({
        operationType: OperationType.Deletion,
        index: oldIdx,
        count: oldState.length - oldIdx,
      })
      break
    }
    const oldValue = oldState[oldIdx]
    const newValue = newState[newIdx]
    const lcsHash = lcsIdx < lcs.length ? hash(lcs[lcsIdx], objectHashes) : undefined
    const oldValueMatchesLcsValue = hash(oldValue, objectHashes) === lcsHash
    const newValueMatchesLcsValue = hash(newValue, objectHashes) === lcsHash
    if (newValueMatchesLcsValue && !oldValueMatchesLcsValue) {
      deletionOperations.push({
        operationType: OperationType.Deletion,
        index: oldIdx,
        count: 1,
      })
      oldIdx++
    } else if (oldValueMatchesLcsValue && !newValueMatchesLcsValue) {
      insertionOperations.push({
        operationType: OperationType.Insertion,
        index: newIdx,
        values: [newState[newIdx]],
      })
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
          if (childDiff.operations.length > 0) {
            nestedOperations.push({
              operationType: OperationType.Nested,
              index: newIdx,
              delta: childDiff,
            })
          }
        } else {
          substitutionOperations.push({
            operationType: OperationType.Substitution,
            index: newIdx,
            value: newValue,
          })
        }
      }
      oldIdx++
      newIdx++
      lcsIdx++
    }
  }

  const operations = [
    ...compressDeletionOperations(deletionOperations).reverse(),
    ...compressInsertionOperations(insertionOperations),
    ...substitutionOperations,
    ...nestedOperations,
  ]
  return {
    type: DeltaType.Array,
    operations,
  }
}

function diffObjects(
  oldState: Record<string, unknown>,
  newState: Record<string, unknown>,
  objectHashes: Map<object | number | string | boolean, number>,
): ObjectDelta {
  const operations: ObjectOperation[] = []
  for (const key in oldState) {
    const oldVal = oldState[key]
    if (!(key in newState)) {
      operations.push({
        operationType: OperationType.Deletion,
        key,
      })
      continue
    }
    const newVal = newState[key]
    const areValuesSameType =
      (isPlainArray(oldVal) && isPlainArray(newVal)) || (isPlainObject(oldVal) && isPlainObject(newVal))
    const isOldValDiffable = isPlainArray(oldVal) || isPlainObject(oldVal)
    const isNewValDiffable = isPlainArray(newVal) || isPlainObject(newVal)
    if (areValuesSameType && isOldValDiffable && isNewValDiffable) {
      const childDiff = diff(oldVal, newVal, objectHashes)
      if (childDiff.operations.length > 0) {
        operations.push({
          operationType: OperationType.Nested,
          key,
          delta: childDiff,
        })
      }
    } else {
      operations.push({
        operationType: OperationType.Substitution,
        key,
        value: newVal,
      })
    }
  }
  for (const key in newState) {
    const newVal = newState[key]
    if (!(key in oldState)) {
      operations.push({
        operationType: OperationType.Insertion,
        key,
        value: newVal,
      })
    }
  }
  return {
    type: DeltaType.Object,
    operations,
  }
}

export function diff(
  oldState: unknown[] | Record<string, unknown>,
  newState: unknown[] | Record<string, unknown>,
  objectHashes?: Map<object | number | string | boolean, number>,
): Delta {
  if (newState === oldState) {
    return {
      type: isPlainArray(oldState) ? DeltaType.Array : DeltaType.Object,
      operations: [],
    }
  }
  if (objectHashes === undefined) {
    objectHashes = new Map()
  }
  if (isPlainArray(oldState)) {
    if (!isPlainArray(newState)) {
      throw new Error('Expected new state to be an Array because old state is an array')
    }
    return diffArrays(oldState, newState, objectHashes)
  }
  if (isPlainArray(newState)) {
    throw new Error('Expected new state not to be an Array because old state is not an array')
  }
  return diffObjects(oldState, newState, objectHashes)
}

export function patch(oldState: unknown[] | Record<string, unknown>, delta: Delta): void {
  if (delta.type === DeltaType.Array) {
    if (!isPlainArray(oldState)) {
      throw new Error('Expected old state to be an Array')
    }

    for (const operation of delta.operations) {
      if (operation.operationType === OperationType.Deletion) {
        oldState.splice(operation.index, operation.count)
      } else if (operation.operationType === OperationType.Insertion) {
        oldState.splice(operation.index, 0, operation.values)
      } else if (operation.operationType === OperationType.Substitution) {
        oldState.splice(operation.index, 1, operation.value)
      } else {
        // Nested
        const inner = oldState[operation.index]
        if (!isPlainArray(inner) && !isPlainObject(inner)) {
          throw new Error('Expected old state to be either an Array or an object')
        }
        patch(inner, operation.delta)
      }
    }
  } else {
    if (!isPlainObject(oldState)) {
      throw new Error('Expected old state to be a plain object')
    }

    for (const operation of delta.operations) {
      if (operation.operationType === OperationType.Deletion) {
        delete oldState[operation.key]
      } else if (
        operation.operationType === OperationType.Substitution ||
        operation.operationType === OperationType.Insertion
      ) {
        oldState[operation.key] = operation.value
      } else {
        // Nested
        const inner = oldState[operation.key]
        if (!isPlainArray(inner) && !isPlainObject(inner)) {
          throw new Error('Expected old state to be either an Array or an object')
        }
        patch(inner, operation.delta)
      }
    }
  }
}
