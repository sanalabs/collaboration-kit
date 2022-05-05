import {
  deepNormalizeJson,
  Delta,
  DeltaType,
  diff,
  isPlainArray,
  isPlainObject,
  JsonTemplateArray,
  JsonTemplateObject,
  OperationType,
} from '@sanalabs/json'
import _ from 'lodash'
import * as Y from 'yjs'
import {
  assertIsYArray,
  assertIsYJson,
  assertIsYMap,
  assertIsYMapOrArray,
  isYArray,
  isYMap,
} from '../assertions'
import { transact, unknownToYTypeOrPrimitive } from '../y-utils'

function patch(yType: Y.Map<unknown> | Y.Array<unknown>, delta: Delta): void {
  if (delta.type === DeltaType.Array) {
    assertIsYArray(yType)

    for (const operation of delta.operations) {
      if (operation.operationType === OperationType.Deletion) {
        yType.delete(operation.index, operation.count)
      } else if (operation.operationType === OperationType.Insertion) {
        yType.insert(
          operation.index,
          operation.values.map(x => unknownToYTypeOrPrimitive(x)),
        )
      } else if (operation.operationType === OperationType.Substitution) {
        yType.delete(operation.index, 1)
        yType.insert(operation.index, [unknownToYTypeOrPrimitive(operation.value)])
      } else {
        // Nested
        const innerYType = yType.get(operation.index)
        assertIsYMapOrArray(innerYType, operation.index)
        patch(innerYType, operation.delta)
      }
    }
  } else {
    assertIsYMap(yType)

    for (const operation of delta.operations) {
      if (operation.operationType === OperationType.Deletion) {
        yType.delete(operation.key)
      } else if (
        operation.operationType === OperationType.Substitution ||
        operation.operationType === OperationType.Insertion
      ) {
        yType.set(operation.key, unknownToYTypeOrPrimitive(operation.value))
      } else {
        // Nested
        const innerYType = yType.get(operation.key)
        assertIsYMapOrArray(innerYType, operation.key)
        patch(innerYType, operation.delta)
      }
    }
  }
}

type PatchYJsonOptions = {
  // The origin of the yjs transaction.
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  origin?: unknown
}

/**
 * Mutate a YMap or YArray into the given `newState`.
 * The mutations are batched in a single transaction.
 * Proper nesting of YMap and YArray is used for nested data.
 */
export function patchYJson(
  yTypeToMutate: Y.Map<unknown> | Y.Array<unknown>,
  newState: JsonTemplateObject | JsonTemplateArray,
  options: PatchYJsonOptions = {},
): void {
  assertIsYJson(yTypeToMutate)
  assertIsYMapOrArray(yTypeToMutate, 'object root')

  newState = _.cloneDeep(newState) // Prevent patchYJson having side effects on newState
  deepNormalizeJson(newState)

  const isYArrayAndArray = isYArray(yTypeToMutate) && isPlainArray(newState)
  const isYMapAndObject = isYMap(yTypeToMutate) && isPlainObject(newState)

  if (!isYArrayAndArray && !isYMapAndObject) {
    throw new Error('Expected either a YArray and an Array, or a YMap and an Object')
  }

  const oldState: unknown = yTypeToMutate.toJSON()
  if (!isPlainArray(oldState) && !isPlainObject(oldState)) {
    throw new Error('Expected old state to be either an Array or an object')
  }
  const delta = diff(oldState, newState)
  if (delta.operations.length === 0 || _.isEqual(oldState, newState)) return

  transact(
    yTypeToMutate,
    () => {
      patch(yTypeToMutate, delta)

      // Verify that the patch was successful
      // This needs to be run inside the transaction, otherwise it is possible that
      // the yDoc has a different value by the time we run the check.
      const yState: unknown = yTypeToMutate.toJSON()
      if (!_.isEqual(yState, newState)) {
        throw new Error(
          `Failed to patch yType. ${JSON.stringify({ yState, newState, oldState, delta }, null, 2)}`,
        )
      }
    },
    options.origin ?? null,
  )
}
