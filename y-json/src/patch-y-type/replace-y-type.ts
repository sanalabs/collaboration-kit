import * as Y from 'yjs'
import { assertIsJsonPrimitive } from '../../../json/src'

function cloneIfYType(value: unknown): unknown {
  if (
    value instanceof Y.Map ||
    value instanceof Y.Array ||
    value instanceof Y.Text ||
    value instanceof Y.XmlFragment ||
    value instanceof Y.XmlElement ||
    value instanceof Y.XmlText
  ) {
    return value.clone()
  }
  assertIsJsonPrimitive(value)
  return value
}

export function replaceYType(
  dst: Y.Map<unknown> | Y.Array<unknown>,
  src: Y.Map<unknown> | Y.Array<unknown>,
): void {
  if (dst instanceof Y.Map && src instanceof Y.Map) {
    const srcKeys = new Set(src.keys())
    for (const key of dst.keys()) {
      if (!srcKeys.has(key)) {
        dst.delete(key)
      }
    }
    src.forEach((value, key) => {
      dst.set(key, cloneIfYType(value))
    })
  } else if (dst instanceof Y.Array && src instanceof Y.Array) {
    dst.delete(0, dst.length)
    dst.insert(0, src.map(cloneIfYType))
  } else {
    throw new Error('Shared objects have different types')
  }
}
