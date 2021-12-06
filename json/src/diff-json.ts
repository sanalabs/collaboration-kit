import { hash } from './hash'
import { longestCommonSubsequence } from './lcs'
import { isPlainArray, isPlainObject } from './type-guards-plain'

export enum OperationType {
  Insertion = 'insert',
  Deletion = 'delete',
  Substitution = 'substitute',
  Nested = 'nested',
}

export interface Operation {
  operationType: OperationType
}

interface ArrayOperation extends Operation {}

interface ObjectOperation extends Operation {}

export interface Delta {
  type: string
  operations: Operation[]
}

export enum DeltaType {
  Array = 'array',
  Object = 'object',
  NoDifference = 'no-diff',
}

export interface ArrayDelta extends Delta {
  type: DeltaType.Array
  operations: ArrayOperation[]
}

export interface ObjectDelta extends Delta {
  type: DeltaType.Object
  operations: ObjectOperation[]
}

export interface NoDelta extends Delta {
  type: DeltaType.NoDifference
  operations: []
}

export const isArrayDelta = (d: Delta): d is ArrayDelta => d.type === DeltaType.Array
export const isObjectDelta = (d: Delta): d is ObjectDelta => d.type === DeltaType.Object
export const isNoDelta = (d: Delta): d is NoDelta => d.type === DeltaType.NoDifference

interface ArrayInsertion extends ArrayOperation {
  operationType: OperationType.Insertion
  index: number
  values: unknown[]
}
interface ArrayDeletion extends ArrayOperation {
  operationType: OperationType.Deletion
  index: number
  count: number
}
interface ArraySubstitution extends ArrayOperation {
  operationType: OperationType.Substitution
  index: number
  value: unknown
}
interface ArrayNestedDelta extends ArrayOperation {
  operationType: OperationType.Nested
  index: number
  delta: Delta
}
interface ObjectInsertion extends ObjectOperation {
  operationType: OperationType.Insertion
  key: string
  value: unknown
}
interface ObjectDeletion extends ObjectOperation {
  operationType: OperationType.Deletion
  key: string
}
interface ObjectSubstitution extends ObjectOperation {
  operationType: OperationType.Substitution
  key: string
  value: unknown
}
interface ObjectNestedDelta extends ObjectOperation {
  operationType: OperationType.Nested
  key: string
  delta: Delta
}

export const isArrayInsertion = (d: ArrayOperation): d is ArrayInsertion =>
  d.operationType === OperationType.Insertion
export const isArrayDeletion = (d: Operation): d is ArrayDeletion =>
  d.operationType === OperationType.Deletion
export const isArraySubstitution = (d: ArrayOperation): d is ArraySubstitution =>
  d.operationType === OperationType.Substitution
export const isArrayNestedDelta = (d: ArrayOperation): d is ArrayNestedDelta =>
  d.operationType === OperationType.Nested
export const isObjectInsertion = (d: ObjectOperation): d is ObjectInsertion =>
  d.operationType === OperationType.Insertion
export const isObjectDeletion = (d: Operation): d is ObjectDeletion =>
  d.operationType === OperationType.Deletion
export const isObjectSubstitution = (d: ObjectOperation): d is ObjectSubstitution =>
  d.operationType === OperationType.Substitution
export const isObjectNestedDelta = (d: ObjectOperation): d is ObjectNestedDelta =>
  d.operationType === OperationType.Nested

function compressInsertionOperations(insertionOperations: ArrayInsertion[]): ArrayInsertion[] {
  const compressedInsertionOperations: ArrayInsertion[] = []
  for (let i = 0; i < insertionOperations.length; i++) {
    const compressedOperation: ArrayInsertion = {
      operationType: OperationType.Insertion,
      index: insertionOperations[i]!.index,
      values: insertionOperations[i]!.values,
    }
    while (i < insertionOperations.length - 1) {
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
      index: deletionOperations[i]!.index,
      count: deletionOperations[i]!.count,
    }
    while (i < deletionOperations.length - 1) {
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

function diffArrays(
  oldState: unknown[],
  newState: unknown[],
  objectHashes: Map<object | number | string | boolean, number>,
): ArrayDelta | NoDelta {
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
      const operation: ArrayInsertion = {
        operationType: OperationType.Insertion,
        index: newIdx,
        values: newState.slice(newIdx),
      }
      insertionOperations.push(operation)
      break
    } else if (newIdx === newState.length) {
      const operation: ArrayDeletion = {
        operationType: OperationType.Deletion,
        index: oldIdx,
        count: oldState.length - oldIdx,
      }
      deletionOperations.push(operation)
      break
    }
    const oldValue = oldState[oldIdx]
    const newValue = newState[newIdx]
    const lcsHash = lcsIdx < lcs.length ? hash(lcs[lcsIdx], objectHashes) : undefined
    const oldValueMatchesLcsValue = hash(oldValue, objectHashes) === lcsHash
    const newValueMatchesLcsValue = hash(newValue, objectHashes) === lcsHash
    if (newValueMatchesLcsValue && !oldValueMatchesLcsValue) {
      const operation: ArrayDeletion = {
        operationType: OperationType.Deletion,
        index: oldIdx,
        count: 1,
      }
      deletionOperations.push(operation)
      oldIdx++
    } else if (oldValueMatchesLcsValue && !newValueMatchesLcsValue) {
      const operation: ArrayInsertion = {
        operationType: OperationType.Insertion,
        index: newIdx,
        values: [newState[newIdx]],
      }
      insertionOperations.push(operation)
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
          if (!isNoDelta(childDiff)) {
            const operation: ArrayNestedDelta = {
              operationType: OperationType.Nested,
              index: newIdx,
              delta: childDiff,
            }
            nestedOperations.push(operation)
          }
        } else {
          const operation: ArraySubstitution = {
            operationType: OperationType.Substitution,
            index: newIdx,
            value: newValue,
          }
          substitutionOperations.push(operation)
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
  if (operations.length === 0) {
    return {
      type: DeltaType.NoDifference,
      operations: [],
    }
  }
  return {
    type: DeltaType.Array,
    operations,
  }
}

function diffObjects(
  oldState: Record<string, unknown>,
  newState: Record<string, unknown>,
  objectHashes: Map<object | number | string | boolean, number>,
): ObjectDelta | NoDelta {
  const operations: ObjectOperation[] = []
  for (const key in oldState) {
    const oldVal = oldState[key]
    if (!(key in newState)) {
      const operation: ObjectDeletion = {
        operationType: OperationType.Deletion,
        key,
      }
      operations.push(operation)
      continue
    }
    const newVal = newState[key]
    const areValuesSameType =
      (isPlainArray(oldVal) && isPlainArray(newVal)) || (isPlainObject(oldVal) && isPlainObject(newVal))
    const isOldValDiffable = isPlainArray(oldVal) || isPlainObject(oldVal)
    const isNewValDiffable = isPlainArray(newVal) || isPlainObject(newVal)
    if (areValuesSameType && isOldValDiffable && isNewValDiffable) {
      const childDiff = diff(oldVal, newVal, objectHashes)
      if (!isNoDelta(childDiff)) {
        const operation: ObjectNestedDelta = {
          operationType: OperationType.Nested,
          key,
          delta: childDiff,
        }
        operations.push(operation)
      }
    } else {
      const operation: ObjectSubstitution = {
        operationType: OperationType.Substitution,
        key,
        value: newVal,
      }
      operations.push(operation)
    }
  }
  for (const key in newState) {
    const newVal = newState[key]
    if (!(key in oldState)) {
      const operation: ObjectInsertion = {
        operationType: OperationType.Insertion,
        key,
        value: newVal,
      }
      operations.push(operation)
    }
  }
  if (operations.length === 0) {
    return {
      type: DeltaType.NoDifference,
      operations: [],
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
      type: DeltaType.NoDifference,
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
  if (isArrayDelta(delta)) {
    if (!isPlainArray(oldState)) {
      throw new Error('Expected old state to be an Array')
    }

    for (const operation of delta.operations) {
      if (isArrayDeletion(operation)) {
        oldState.splice(operation.index, operation.count)
      } else if (isArrayInsertion(operation)) {
        oldState.splice(operation.index, 0, operation.values)
      } else if (isArraySubstitution(operation)) {
        oldState.splice(operation.index, 1, operation.value)
      } else if (isArrayNestedDelta(operation)) {
        const inner = oldState[operation.index]
        if (!isPlainArray(inner) && !isPlainObject(inner)) {
          throw new Error('Expected old state to be either an Array or an object')
        }
        patch(inner, operation.delta)
      }
    }
  } else if (isObjectDelta(delta)) {
    if (!isPlainObject(oldState)) {
      throw new Error('Expected old state to be a plain object')
    }

    for (const operation of delta.operations) {
      if (isObjectDeletion(operation)) {
        delete oldState[operation.key]
      } else if (isObjectSubstitution(operation) || isObjectInsertion(operation)) {
        oldState[operation.key] = operation.value
      } else if (isObjectNestedDelta(operation)) {
        const inner = oldState[operation.key]
        if (!isPlainArray(inner) && !isPlainObject(inner)) {
          throw new Error('Expected old state to be either an Array or an object')
        }
        patch(inner, operation.delta)
      }
    }
  } else if (!isNoDelta(delta)) {
    throw new Error('Expected delta to be an array delta, an object delta or no delta.')
  }
}
