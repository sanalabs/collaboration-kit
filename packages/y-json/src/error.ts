export function mkErr(val: unknown, type: string): Error {
  return new Error(`Expected ${JSON.stringify(val)} to be ${type}`)
}
