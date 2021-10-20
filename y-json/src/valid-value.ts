export type ValidPrimitiveTypes = string | boolean | number | null
export type ValidObject = { [key: string]: ValidValue }
export type ValidArray = ValidValue[]

/**
 * ValidValue describes the types of values that can be operated on by this library.
 *
 * We do not allow, for example, `undefined` values, since these do not serialize well.
 */
export type ValidValue = ValidObject | ValidPrimitiveTypes | ValidArray

export const isValidArray = (val: unknown): val is ValidArray => Array.isArray(val)

export const isValidObject = (val: unknown): val is ValidObject => val instanceof Object

export const isValidValue = (val: unknown): val is ValidValue => {
  return (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    val === null ||
    isValidArray(val) ||
    isValidObject(val)
  )
}

export const assertIsValidValue = (val: unknown): val is ValidValue => {
  const isValid = isValidValue(val)
  if (!isValid) throw new Error(`Expected val to be a valid value, but got ${JSON.stringify(val)}`)
  return isValid
}
