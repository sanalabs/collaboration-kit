export type PlainObject = Record<string, unknown>
export type PlainArray = unknown[]
export type PlainContainer = PlainObject | PlainArray

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [key: string]: Json }
export type JsonArray = Json[]
export type JsonContainer = JsonObject | JsonArray
export type Json = JsonPrimitive | JsonContainer

export type JsonTemplatePrimitive = string | number | boolean | null | undefined
export type JsonTemplateObject = { [key: string]: JsonTemplate }
export type JsonTemplateArray = JsonTemplate[]
export type JsonTemplateContainer = JsonTemplateObject | JsonTemplateArray
export type JsonTemplate = JsonTemplatePrimitive | JsonTemplateContainer

export type JsonTemplateObjectDeep = { [key: string]: JsonTemplatePrimitive | JsonTemplateObjectDeep }

/**
 * The value `undefined` is not a valid JSON type, but since JS/TS is inconsistent with how undefined is
 * treated, this library allows `undefined` as an input value and treats it as a delete operation. The value
 * `undefined` is never used for insert operations.
 *
 * The resason for this is that a property with the value `undefined` in JS/TS is in some contexts considered
 * equivalent to that property not existing. For example:
 *
 * ```js
 * JSON.stringify({ prop: undefined }) === JSON.stringify({}) // '{}'
 *
 * const obj = { a: undefined }
 * obj.a === obj.b // true
 * ```
 *
 * Handling of `undefined` is not consistent for arrays:
 *
 * ```js
 * JSON.stringify([undefined]) === JSON.stringify([null]) // What!?
 * ```
 *
 * This library fully deletes the `undefined` value in all contexts, including arrays, just like for objects.
 */
