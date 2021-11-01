import { applyPatch, compare } from 'fast-json-patch'
import {
  assertIsJson,
  isJsonPrimitive,
  isPlainArray,
  isPlainObject,
  Json,
  JsonArray,
  JsonContainer,
  JsonObject,
  JsonPrimitive,
} from './'
import { mkErr } from './error'

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

type JsonTemplatePrimitive = JsonPrimitive | undefined
type JsonTemplateObject = { [key: string]: JsonTemplate }
type JsonTemplateArray = JsonTemplate[]
type JsonTemplateContainer = JsonTemplateObject | JsonTemplateArray
type JsonTemplate = JsonTemplatePrimitive | JsonTemplateContainer

function isJsonTemplatePrimitive(val: unknown): val is JsonTemplatePrimitive {
  if (isJsonPrimitive(val)) return true
  if (val === undefined) return true
  return false
}

function assertIsJsonTemplatePrimitive(val: unknown): asserts val is JsonTemplatePrimitive {
  if (!isJsonTemplatePrimitive(val))
    throw mkErr(val, 'JSON template primitive (string | number | boolean | null | undefined)')
}

function assertIsJsonTemplate(val: unknown): asserts val is Json {
  if (isPlainObject(val)) {
    Object.values(val).forEach(assertIsJsonTemplate)
  } else if (isPlainArray(val)) {
    val.forEach(assertIsJsonTemplate)
  } else {
    assertIsJsonTemplatePrimitive(val)
  }
}

// After application, objectToMutate will contain everything in newState.
// Keys in objectToMutate are untouched if not present in newState.
// Reference equality in objectToMutate is preserved whenever possible.
// `undefined` values in newState objects denote deletions for objectToMutate
export function deepMergeJson<T extends JsonObject>(objectToMutate: T, newState: JsonTemplateObject): void
export function deepMergeJson<T extends JsonArray>(objectToMutate: T, newState: T): void
export function deepMergeJson<T extends JsonContainer>(objectToMutate: T, newState: T): void {
  assertIsJson(objectToMutate)
  assertIsJsonTemplate(newState)
  const diffs = compare(objectToMutate, newState).filter(
    diff => diff.op !== 'remove' || keyExists(newState, diff.path) === true,
  )
  applyPatch(objectToMutate, diffs)
}

// After application, objectToMutate will be deep-value-equal to newState.
// Reference equality in objectToMutate is preserved whenever possible.
export function deepPatchJson<T extends JsonObject>(objectToMutate: T, newState: T): void
export function deepPatchJson<T extends JsonArray>(objectToMutate: T, newState: T): void
export function deepPatchJson<T extends JsonContainer>(objectToMutate: T, newState: T): void {
  assertIsJson(objectToMutate)
  assertIsJsonTemplate(newState)
  applyPatch(objectToMutate, compare(objectToMutate, newState))
}
