import * as Y from 'yjs'

const ongoingTransactions: WeakSet<Y.Doc> = new WeakSet()
let id = Math.random()

/**
 * Run a transaction within `yType`'s document's transaction, if it is available. Otherwise just run the transaction.
 */
export function transact(yType: Y.Map<unknown> | Y.Array<unknown>, transaction: () => void): void {
  const { doc } = yType
  if (doc !== null) {
    doc.transact(() => {
      if (ongoingTransactions.has(doc)) {
        console.error('NESTED TRANSACTION DETECTED')
        throw new Error(`Nested transaction detected in doc: ${JSON.stringify(doc)}`)
      }

      console.debug(`[SyncYMap] [${id}] Starting transaction:`, doc.clientID, ongoingTransactions.has(doc))
      ongoingTransactions.add(doc)
      transaction()
      console.debug(`[SyncYMap] [${id}] Ending transaction:`, doc.clientID, ongoingTransactions.has(doc))
      ongoingTransactions.delete(doc)
    })
  } else transaction()
}
