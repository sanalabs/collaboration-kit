export class AssertionError extends Error {}

export function mkErr(val: unknown, type: string): AssertionError {
  return new AssertionError(`Expected ${JSON.stringify(val)} to be ${type}`)
}
