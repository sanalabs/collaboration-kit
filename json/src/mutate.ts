import { applyPatch, compare } from 'fast-json-patch'
import {
  assertIsJsonTemplate,
  JsonTemplateArray,
  JsonTemplateContainer,
  JsonTemplateObject,
  JsonTemplateObjectDeep,
} from './'
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

  const diffs = compare(objectToMutate, newState).filter(
    diff => diff.op !== 'remove' || keyExists(newState, diff.path) === true,
  )

  applyPatch(objectToMutate, diffs)
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

  applyPatch(objectToMutate, compare(objectToMutate, newState))
  deepNormalizeJson(objectToMutate)
}
