import _ from 'lodash'
import * as Y from 'yjs'
import { isPlainArray, isPlainObject, JsonArray, JsonObject } from '../../../json/src'
import { assertIsYMapOrArray, isYArray, isYMap } from '../assertions'
import { transact } from '../y-utils'
import * as patchDiffJsonExtensions from './patch-diff-json-extensions'

type PatchYTypeOptions = {
  // The origin of the yjs transaction.
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  origin?: unknown
}
/**
 * Mutate a Y.Map or Y.Array into the given `newState`.
 * The mutations will be batched in a single transaction if the yjs type is within a document.
 */
export function patchYType(
  yTypeToMutate: Y.Map<unknown>,
  newState: JsonObject,
  options?: PatchYTypeOptions,
): void
export function patchYType(
  yTypeToMutate: Y.Array<unknown>,
  newState: JsonArray,
  options?: PatchYTypeOptions,
): void
export function patchYType(yTypeToMutate: any, newState: any, options: PatchYTypeOptions = {}): void {
  assertIsYMapOrArray(yTypeToMutate, 'object root')

  const isYArrayAndArray = isYArray(yTypeToMutate) && isPlainArray(newState)
  const isYMapAndObject = isYMap(yTypeToMutate) && isPlainObject(newState)

  if (!isYArrayAndArray && !isYMapAndObject) {
    throw new Error('Expected either a Y.Array and an Array, or a Y.Map and an object')
  }

  const oldState: unknown = yTypeToMutate.toJSON()
  const delta = patchDiffJsonExtensions.diff(oldState, newState)
  if (delta === undefined || _.isEqual(oldState, newState)) return

  transact(
    yTypeToMutate,
    () => {
      patchDiffJsonExtensions.patch(yTypeToMutate, delta)

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
