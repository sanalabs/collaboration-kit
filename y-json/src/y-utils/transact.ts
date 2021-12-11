import * as Y from 'yjs'

/**
 * Run a transaction within `yType`'s document's transaction, if it is available. Otherwise throw since Yjs
 * does not support operating on YTypes that are not attached to a YDoc. See the upstream issue
 * https://github.com/yjs/yjs/issues/207
 */
export function transact(
  yType: Y.Map<unknown> | Y.Array<unknown>,
  transaction: () => void,
  origin: unknown,
): void {
  if (!yType.doc) {
    throw new Error('Refusing to operate on an YType that is not attached to a YDoc.')
  }

  yType.doc.transact(transaction, origin)
}
