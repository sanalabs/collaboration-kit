import {
  assertIsJsonTemplate,
  JsonTemplateArray,
  JsonTemplateContainer,
  JsonTemplateObject,
  JsonTemplateObjectDeep,
} from './'
import {
  Delta,
  DeltaType,
  diff,
  isArrayNestedDelta,
  isObjectNestedDelta,
  Operation,
  OperationType,
  patch,
} from './diff-json'
import { deepNormalizeJson } from './normalize-json'

type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> | undefined }

function removeDeletionDeltas(delta: Delta): Delta {
  const operations: Operation[] = []
  for (const operation of delta.operations) {
    if (operation.operationType !== OperationType.Deletion) {
      if (isArrayNestedDelta(operation) || isObjectNestedDelta(operation)) {
        removeDeletionDeltas(operation.delta)
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
  delta.operations = operations
  return delta
}

// After application, objectToMutate will contain everything in newState.
// Keys in objectToMutate are untouched if not present in newState.
// Reference equality in objectToMutate is preserved whenever possible.
// `undefined` values are removed
export function deepMergeJson<T extends JsonTemplateObjectDeep>(
  objectToMutate: T,
  newState: DeepPartial<T>,
): void {
  assertIsJsonTemplate(objectToMutate)
  assertIsJsonTemplate(newState)
  let delta = diff(objectToMutate, newState)
  delta = removeDeletionDeltas(delta)
  patch(objectToMutate, delta)
  deepNormalizeJson(objectToMutate)
}

// After application, objectToMutate will be deep-value-equal to newState.
// Reference equality in objectToMutate is preserved whenever possible.
// `undefined` values are removed
export function deepPatchJson<T extends JsonTemplateObject>(objectToMutate: T, newState: T): void
export function deepPatchJson<T extends JsonTemplateArray>(objectToMutate: T, newState: T): void
export function deepPatchJson<T extends JsonTemplateContainer>(objectToMutate: T, newState: T): void {
  assertIsJsonTemplate(objectToMutate)
  assertIsJsonTemplate(newState)

  patch(objectToMutate, diff(objectToMutate, newState))
  deepNormalizeJson(objectToMutate)
}
