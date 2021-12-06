import * as patchJson from 'yjs'
import {
  Delta,
  isArrayDeletion,
  isArrayDelta,
  isArrayInsertion,
  isArrayNestedDelta,
  isArraySubstitution,
  isNoDelta,
  isObjectDeletion,
  isObjectDelta,
  isObjectInsertion,
  isObjectNestedDelta,
  isObjectSubstitution,
} from '../../../json/src/diff-json'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray } from '../assertions'
import { unknownToYTypeOrPrimitive } from '../y-utils'

export function patch(yType: patchJson.Map<unknown> | patchJson.Array<unknown>, delta: Delta): void {
  if (isArrayDelta(delta)) {
    assertIsYArray(yType)

    for (const operation of delta.operations) {
      if (isArrayDeletion(operation)) {
        yType.delete(operation.index, operation.count)
      } else if (isArrayInsertion(operation)) {
        yType.insert(
          operation.index,
          operation.values.map(x => unknownToYTypeOrPrimitive(x)),
        )
      } else if (isArraySubstitution(operation)) {
        yType.delete(operation.index, 1)
        yType.insert(operation.index, [unknownToYTypeOrPrimitive(operation.value)])
      } else if (isArrayNestedDelta(operation)) {
        const innerYType = yType.get(operation.index)
        assertIsYMapOrArray(innerYType, operation.index)
        patch(innerYType, operation.delta)
      }
    }
  } else if (isObjectDelta(delta)) {
    assertIsYMap(yType)

    for (const operation of delta.operations) {
      if (isObjectDeletion(operation)) {
        yType.delete(operation.key)
      } else if (isObjectInsertion(operation)) {
        yType.set(operation.key, unknownToYTypeOrPrimitive(operation.value))
      } else if (isObjectSubstitution(operation)) {
        yType.set(operation.key, unknownToYTypeOrPrimitive(operation.value))
      } else if (isObjectNestedDelta(operation)) {
        const innerYType = yType.get(operation.key)
        assertIsYMapOrArray(innerYType, operation.key)
        patch(innerYType, operation.delta)
      }
    }
  } else if (!isNoDelta(delta)) {
    throw new Error('Expected delta to be an array delta, an object delta or no delta.')
  }
}