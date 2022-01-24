import { Store, Unsubscribe } from 'redux'

/**
 * Reference equality caching for store.subscribe
 *
 * The behefit of using store.subscribe is that it gives synchronous updates in contrast to `useSelector`
 * together with `useEffect`. The React life cycle allow other code to run before an effect triggers. This
 * causes a data race that is usually not noticed but for SyncYJson it is critical and results in data loss
 * since the selected data is diffed against the YDoc state to produce Yjs operations.
 *
 * See the Redux docs for more info: https://redux.js.org/api/store#example-1
 */
export const cachedSubscribe = <T>(
  store: Store,
  selector: (state: any) => T,
  callback: (data: T) => void,
): Unsubscribe => {
  let stateCache: T | undefined = undefined

  const unsubscribe = store.subscribe(() => {
    const newState = selector(store.getState())
    if (stateCache !== newState) {
      stateCache = newState
      callback(stateCache)
    }
  })

  return unsubscribe
}
