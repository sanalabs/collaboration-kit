import * as Y from 'yjs'
import { isYArray, isYMap } from '../assertions'

export function getOrCreateNestedYMap(yMap: Y.Map<unknown>, key: string): Y.Map<unknown> {
  const mapValue = yMap.get(key)

  if (isYMap(mapValue)) return mapValue

  const newYMap = new Y.Map()
  yMap.set(key, newYMap)
  return newYMap
}

export function getOrCreateNestedYArray(yMap: Y.Map<unknown>, key: string): Y.Array<unknown> {
  const arrayValue = yMap.get(key)

  if (isYArray(arrayValue)) return arrayValue

  const newYArray = new Y.Array()
  yMap.set(key, newYArray)
  return newYArray
}
