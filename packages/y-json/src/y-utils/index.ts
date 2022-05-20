export * from './create-types'
export * from './to-y-type'
export * from './transact'
import * as Y from 'yjs'
import { isYArray } from '../assertions'

export function isEmpty(yType: Y.Map<unknown> | Y.Array<unknown>): boolean {
  if (isYArray(yType)) {
    return yType.length === 0
  }
  return yType.size === 0
}
