import * as Y from 'yjs'
import { assertIsJson } from '../../json/src'
import { assertIsYMapOrArray } from './assertions'

export const patchYType = (
  yTypeToMutate: Y.Map<unknown> | Y.Array<unknown>,
  newJsonState: Record<string, unknown> | Array<unknown>,
): void => {
  assertIsYMapOrArray(yTypeToMutate, 'object root')
  assertIsJson(newJsonState)
  throw new Error('TODO copy over this code')
}
