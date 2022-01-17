import {
  assertIsPlainContainer,
  isJsonPrimitive,
  isPlainArray,
  isPlainContainer,
  isPlainObject,
  JsonContainer,
  PlainContainer,
} from '.'

// Deep remove all non-json values
export function deepNormalizeJson(val: PlainContainer): asserts val is JsonContainer {
  assertIsPlainContainer(val)

  if (isPlainObject(val)) {
    for (const key in val) {
      const innerVal = val[key]
      if (isJsonPrimitive(innerVal)) {
        // ok
      } else if (isPlainContainer(innerVal)) {
        deepNormalizeJson(innerVal)
      } else {
        delete val[key]
      }
    }
  } else if (isPlainArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const innerVal = val[i]
      if (isJsonPrimitive(innerVal)) {
        // ok
      } else if (isPlainContainer(innerVal)) {
        deepNormalizeJson(innerVal)
      } else {
        val.splice(i, 1)
        i--
      }
    }
  } else {
    throw new Error('Unreachable')
  }
}
