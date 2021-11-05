import _ from 'lodash'
import * as Y from 'yjs'
import { isPlainArray, isPlainObject, JsonArray, JsonObject } from '../../../json/src'
import { assertIsYMapOrArray, isYArray, isYMap } from '../assertions'
import { transact } from '../y-utils'
import * as patchDiffJsonExtensions from './patch-diff-json-extensions'

/**
 * Mutate a Y.Map or Y.Array into the given `newState`.
 * The mutations will be batched in a single transaction if the yjs type is within a document.
 */
export function patchYType(yTypeToMutate: Y.Map<unknown>, newState: JsonObject): void
export function patchYType(yTypeToMutate: Y.Array<unknown>, newState: JsonArray): void
export function patchYType(yTypeToMutate: any, newState: any): void {
  assertIsYMapOrArray(yTypeToMutate, 'object root')

  transact(yTypeToMutate, () => {
    const isYArrayAndArray = isYArray(yTypeToMutate) && isPlainArray(newState)
    const isYMapAndObject = isYMap(yTypeToMutate) && isPlainObject(newState)

    if (!isYArrayAndArray && !isYMapAndObject) {
      throw new Error('Expected either a Y.Array and an Array, or a Y.Map and an object')
    }

    const oldState: unknown = yTypeToMutate.toJSON()
    const delta = patchDiffJsonExtensions.diff(oldState, newState)
    if (delta !== undefined && !_.isEqual(oldState, newState)) {
      patchDiffJsonExtensions.patch(yTypeToMutate, delta)
    }

    const yState: unknown = yTypeToMutate.toJSON()
    if (!_.isEqual(yState, newState)) {
      throw new Error(
        `Failed to patch yType. yType state: ${JSON.stringify(yState)}, expected state: ${JSON.stringify(
          newState,
        )}, oldState: ${JSON.stringify(oldState)}`,
      )
    }
    return
  })
}
