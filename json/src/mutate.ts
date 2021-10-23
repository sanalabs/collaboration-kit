import { applyPatch, compare } from 'fast-json-patch'
import { assertIsJson, assertIsJsonTemplate } from './validate'

export function deepPatchJson<T extends Record<string, unknown> | Array<unknown>>(
  objectToMutate: T,
  newState: T,
): void {
  assertIsJson(objectToMutate)
  assertIsJsonTemplate(newState)
  applyPatch(objectToMutate, compare(objectToMutate, newState))
}

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

export function deepMergeJson<T1 extends Record<string, unknown>, T2 extends Array<unknown>>(
  objectToMutate: T1 | T2,
  newState: Partial<T1> | T2,
): void {
  assertIsJson(objectToMutate)
  assertIsJsonTemplate(newState)
  const diffs = compare(objectToMutate, newState).filter(
    diff => diff.op !== 'remove' || keyExists(newState, diff.path) === true,
  )
  applyPatch(objectToMutate, diffs)
}
