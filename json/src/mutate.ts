import {
  assertIsJsonTemplate,
  JsonTemplateArray,
  JsonTemplateContainer,
  JsonTemplateObject,
  JsonTemplateObjectDeep,
} from './'
import {
  Delta,
  diff,
  isArrayNestedDelta,
  isObjectNestedDelta,
  Operation,
  OperationType,
  patch,
} from './diff-json'
import { deepNormalizeJson } from './normalize-json'

function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined) throw new Error()
  if (val === null) throw new Error()
}

const keyExists = (obj: any, path: string): boolean => {
  const keys = path.split('/')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let curr = obj
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i]
    assertIsDefined(key)
    if (!(key in curr)) return false
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    curr = curr[key]
  }

  return true
}

type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> | undefined }

function removeDeltaDeletions(delta: Delta): void {
  const operations: Operation[] = []
  for (const operation of delta.operations) {
    if (operation.operationType !== OperationType.Deletion) {
      if (isArrayNestedDelta(operation) || isObjectNestedDelta(operation)) {
        removeDeltaDeletions(operation.delta)
      }
      operations.push(operation)
    }
  }
  delta.operations = operations
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
  const delta = diff(objectToMutate, newState)
  removeDeltaDeletions(delta)
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
