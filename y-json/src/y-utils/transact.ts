import * as Y from 'yjs'

/**
 * Run a transaction within `yType`'s document's transaction, if it is available. Otherwise just run the transaction.
 */
export function transact(
  yType: Y.Map<unknown> | Y.Array<unknown>,
  transaction: () => void,
  origin: any,
): void {
  const { doc } = yType
  if (doc !== null) doc.transact(transaction, origin)
  else transaction()
}
