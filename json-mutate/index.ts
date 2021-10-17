import { applyPatch, compare } from 'fast-json-patch'
import merge from 'lodash.merge'
import { assertIsJson } from '../json/src'

export function patchJson<T extends Record<string, unknown> | Array<unknown>>(
  objectToMutate: T,
  newState: T,
): void {
  assertIsJson(objectToMutate)
  assertIsJson(newState)
  applyPatch(objectToMutate, compare(objectToMutate, newState))
}

export function mergeJson<T extends Record<string, unknown> | Array<unknown>>(
  objectToMutate: T,
  newState: T,
): void {
  assertIsJson(objectToMutate)
  assertIsJson(newState)
  merge(objectToMutate, newState)
}
