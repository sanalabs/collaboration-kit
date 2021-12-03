import { isPlainArray, isPlainObject } from '../../../json/src'

const Prime1 = 510137
const Prime2 = 472369
const Prime3 = 751321
const Prime4 = 532489
const Prime5 = 301813
const Prime6 = 545023
const Prime7 = 31

export function hash(state: unknown, objectHashes: Map<object | number | string | boolean, number>): number {
  if (typeof state === 'number') {
    return Math.imul(state, Prime1)
  }
  if (typeof state === 'boolean') {
    return state ? Prime2 : Prime3
  }
  if (typeof state === 'string') {
    let h = Prime4
    for (let i = 0; i < state.length; i++) {
      h = Math.imul(h, Prime7) ^ state.charCodeAt(i)
    }
    return h
  }
  if (typeof state !== 'object') {
    throw new Error('Unreachable')
  }
  if (state === null) {
    return Prime5
  }
  let h = objectHashes.get(state)
  if (h !== undefined) {
    return h
  }
  h = Prime6
  if (isPlainArray(state)) {
    for (const child of state) {
      h = Math.imul(h, Prime7) ^ hash(child, objectHashes)
    }
  } else if (isPlainObject(state)) {
    for (const key in state) {
      const child = state[key]
      h = Math.imul(h, Prime7) ^ hash(key, objectHashes)
      h = Math.imul(h, Prime7) ^ hash(child, objectHashes)
    }
  }
  objectHashes.set(state, h)
  return h
}
