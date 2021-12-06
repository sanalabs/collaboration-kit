import * as patchJson from 'yjs'
import { Delta, DeltaType, OperationType } from '../../../json/src/diff-json'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray } from '../assertions'
import { unknownToYTypeOrPrimitive } from '../y-utils'

export function patch(yType: patchJson.Map<unknown> | patchJson.Array<unknown>, delta: Delta): void {
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
      } else if (operation.operationType === OperationType.Nested) {
        const innerYType = yType.get(operation.index)
        assertIsYMapOrArray(innerYType, operation.index)
        patch(innerYType, operation.delta)
      }
    }
  } else if (delta.type === DeltaType.Object) {
    assertIsYMap(yType)

    for (const operation of delta.operations) {
      if (operation.operationType === OperationType.Deletion) {
        yType.delete(operation.key)
      } else if (
        operation.operationType === OperationType.Substitution ||
        operation.operationType === OperationType.Insertion
      ) {
        yType.set(operation.key, unknownToYTypeOrPrimitive(operation.value))
      } else if (operation.operationType === OperationType.Nested) {
        const innerYType = yType.get(operation.key)
        assertIsYMapOrArray(innerYType, operation.key)
        patch(innerYType, operation.delta)
      }
    }
  } else {
    throw new Error('Expected delta to be an array delta, an object delta or no delta.')
  }
}
