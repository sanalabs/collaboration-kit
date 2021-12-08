import * as fc from 'fast-check'
import { Arbitrary } from 'fast-check'
import { isArray, isObject } from 'lodash'
import {
  assertIsJsonArray,
  assertIsJsonObject,
  isJsonPrimitive,
  isPlainObject,
  JsonArray,
  JsonObject,
  JsonTemplateObjectDeep,
} from '../src'

// We strictly want values that can be serialized as JSON.
// fast-check by default gives us -0, which can be deserialized but not serialized.
// See: https://github.com/dubzzz/fast-check/blob/main/documentation/Arbitraries.md
const encodeJson = (val: unknown): unknown => JSON.parse(JSON.stringify(val))

export const arbitraryJSONObject = (): Arbitrary<JsonObject> =>
  fc
    .jsonObject({ maxDepth: 10 })
    .map(encodeJson)
    .map(obj => (isObject(obj) && !isArray(obj) ? obj : { a: obj }))
    .map(it => {
      assertIsJsonObject(it)
      return it
    })

export const arbitraryJSONArray = (): Arbitrary<JsonArray> =>
  fc
    // The default maxLength is too short
    .array(fc.jsonObject(), { maxLength: 100 })
    .map(encodeJson)
    .map(it => {
      assertIsJsonArray(it)
      return it
    })

export const removeArrayProperties = (x: JsonObject): JsonTemplateObjectDeep => {
  const y: JsonTemplateObjectDeep = {}
  for (const key in x) {
    const value = x[key]
    if (isJsonPrimitive(value)) {
      y[key] = value
    } else if (isPlainObject(value)) {
      y[key] = removeArrayProperties(value)
    }
  }
  return y
}

export const cloneWithArbitraryDeletions = (x: JsonTemplateObjectDeep): JsonTemplateObjectDeep => {
  const y: JsonTemplateObjectDeep = {}
  for (const key in x) {
    if (Math.random() < 0.5) {
      const value = x[key]
      if (isJsonPrimitive(value) || value === undefined) {
        y[key] = value
      } else {
        y[key] = cloneWithArbitraryDeletions(value)
      }
    }
  }
  return y
}
