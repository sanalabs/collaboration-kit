import * as fc from 'fast-check'
import { Arbitrary } from 'fast-check'
import { isArray, isObject } from 'lodash'
import * as Y from 'yjs'
import { assertIsJsonArray, assertIsJsonObject, JsonArray, JsonObject } from '../../json/src'

export type RandomArr = RandomValue[]
export type RandomPrimitive = string | number | boolean
export type RandomValue = RandomPrimitive | RandomArr | RandomObj
export type RandomObj = { [key: string]: RandomValue }

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

export const arbitraryLongString = (): Arbitrary<string> => fc.string({ maxLength: 500 })

export const makeDoc = (): Y.Doc => new Y.Doc()

export const makeYMap = (): Y.Map<unknown> => makeDoc().getMap('test-map')

export const makeYArray = (): Y.Array<unknown> => makeDoc().getArray('test-array')
