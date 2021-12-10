import * as Y from 'yjs'

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
  return value
}

export function replaceYType(
  dst: Y.Map<unknown> | Y.Array<unknown>,
  src: Y.Map<unknown> | Y.Array<unknown>,
): void {
  if (dst instanceof Y.Map && src instanceof Y.Map) {
    const srcKeys: Set<string> = new Set()
    src.forEach((value, key) => {
      srcKeys.add(key)
    })
    dst.forEach((value, key) => {
      if (!srcKeys.has(key)) {
        dst.delete(key)
      }
    })
    src.forEach((value, key) => {
      dst.set(key, cloneIfYType(value))
    })
  } else if (dst instanceof Y.Array && src instanceof Y.Array) {
    dst.delete(0, dst.length)
    src.forEach((value, index) => {
      dst.insert(index, [cloneIfYType(value)])
    })
  } else {
    throw 'Failed to rollback document: shared objects have different types'
  }
}
