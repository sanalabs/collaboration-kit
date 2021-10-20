import * as Y from 'yjs'
import { isPlainArray, isPlainObject, PlainArray, PlainObject } from '../../json/src/validate'
import { assertIsYArray, assertIsYMap, assertIsYMapOrArray, isYArray, isYMap } from './assertions'
import { diff, Diff } from './diff'
import { getOrCreateNestedYArray, getOrCreateNestedYMap, toYType, transact } from './y-utils'

function applyDiff(yType: Y.Map<unknown> | Y.Array<unknown>, diff: Diff): void {
  switch (diff.type) {
    case 'delete': {
      assertIsYMap(yType)

      const { key } = diff
      yType.delete(key)
      return
    }
    case 'upsert': {
      assertIsYMap(yType)

      const { key, value } = diff
      yType.set(key, value)
      return
    }
    case 'nest': {
      assertIsYMap(yType)

      const { key, diffs } = diff
      const innerYMap = getOrCreateNestedYMap(yType, key)

      const nestedDiffs = diffs
      nestedDiffs.forEach(diff => applyDiff(innerYMap, diff))
      return
    }
    case 'array-delete': {
      assertIsYArray(yType)

      const { index } = diff
      yType.delete(index, 1)
      return
    }
    case 'array-upsert': {
      assertIsYArray(yType)

      const { index, value } = diff
      yType.insert(index, [toYType(value)])
      return
    }
    case 'array-nest': {
      assertIsYMap(yType)

      const { key, diffs } = diff
      const yArray = getOrCreateNestedYArray(yType, key)
      diffs.forEach(diff => applyDiff(yArray, diff))
      return
    }
  }
}

export function patchYType(yTypeToMutate: Y.Map<unknown>, newState: PlainObject): void
export function patchYType(yTypeToMutate: Y.Array<unknown>, newState: PlainArray): void
export function patchYType(yTypeToMutate: any, newState: any): void {
  assertIsYMapOrArray(yTypeToMutate, 'object root')

  transact(yTypeToMutate, () => {
    const isYArrayAndArray = isYArray(yTypeToMutate) && isPlainArray(newState)
    const isYMapAndObject = isYMap(yTypeToMutate) && isPlainObject(newState)

    if (isYArrayAndArray || isYMapAndObject) {
      const oldState: unknown = yTypeToMutate.toJSON()
      const diffs = diff(oldState, newState)
      diffs.forEach(diff => applyDiff(yTypeToMutate, diff))

      return
    }

    throw new Error('Expected either a Y.Array and an Array, or a Y.Map and an object')
  })
}
