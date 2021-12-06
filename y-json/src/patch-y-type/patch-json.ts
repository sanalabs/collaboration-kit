import * as patchJson from 'yjs'
import {
  Delta,
  isArrayDeletion,
  isArrayDelta,
  isArrayInsertion,
  isArrayNestedDelta,
  isArraySubstitution,
  isObjectDeletion,
  isObjectDelta,
  isObjectInsertion,
  isObjectNestedDelta,
  isObjectSubstitution,
} from '../../../json/src/diff-json'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray } from '../assertions'
import { unknownToYTypeOrPrimitive } from '../y-utils'

export function patch(yType: patchJson.Map<unknown> | patchJson.Array<unknown>, delta: Delta): void {
  // console.log(`Calling patch(${JSON.stringify(yType)}, ${JSON.stringify(delta)})`)
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
    // console.log('isObjectDelta')
    assertIsYMap(yType)
    // console.log('isYMap')

    for (const operation of delta.operations) {
      // console.log('operation: ', JSON.stringify(operation))
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
    // console.log('Applied all operations')
  } else {
    throw new Error('Expected delta to be either an array delta or an object delta.')
  }
}
