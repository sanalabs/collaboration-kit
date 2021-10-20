export type ValidPrimitive = string | boolean | number | null
export type ValidObject = { [key: string]: ValidValue }
export type ValidArray = ValidValue[]

/**
 * ValidValue describes the types of values that can be operated on by this library.
 *
 * We do not allow, for example, `undefined` values, since these do not serialize well.
 */
export type ValidValue = ValidObject | ValidPrimitive | ValidArray

export function isValidArray(val: unknown): val is ValidArray {
  return Array.isArray(val)
}

export function isValidObject(val: unknown): val is ValidObject {
  return val instanceof Object
}

export function isValidPrimitive(val: unknown): val is ValidPrimitive {
  return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null
}

export function isValidValue(val: unknown): val is ValidValue {
  return isValidPrimitive(val) || isValidArray(val) || isValidObject(val)
}

export function assertIsValidValue(val: unknown): val is ValidValue {
  const isValid = isValidValue(val)
  if (!isValid) throw new Error(`Expected val to be a valid value, but got ${JSON.stringify(val)}`)
  return isValid
}
