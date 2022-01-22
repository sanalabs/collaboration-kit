import { JsonTemplateArray, JsonTemplateContainer, JsonTemplateObject } from '@sanalabs/json'
import { patchYJson } from '@sanalabs/y-json'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { useDispatch, useStore } from 'react-redux'
import { Store } from 'redux'
import * as Y from 'yjs'

function handleChange<T extends JsonTemplateContainer, RootState>(
  source: 'local' | 'remote',
  store: Store,
  selectData: (state: RootState) => T | undefined,
  setData: (data: T) => any,
  yJson: Y.Map<unknown> | Y.Array<unknown>,
): void {
  const syncLocalIntoRemote = (): void => {
    const localData = selectData(store.getState() as RootState)
    if (localData === undefined) {
      console.debug('[SyncYJson:syncLocalIntoRemote] Not syncing: Local data is undefined')
      return
    }

    console.debug('[SyncYJson:syncLocalIntoRemote] Syncing')
    patchYJson(yJson, localData, { origin })
  }

  const syncRemoteIntoLocal = (): void => {
    const remoteData: unknown = yJson.toJSON()
    const localData = selectData(store.getState() as RootState)
    if (_.isEqual(remoteData, localData)) {
      console.debug('[SyncYJson:syncRemoteIntoLocal] Not syncing: Remote already equals local data')
      return
    }

    console.debug('[SyncYJson:syncRemoteIntoLocal] Syncing')
    store.dispatch(setData(remoteData as T))
  }

  if (source === 'local') {
    syncLocalIntoRemote()
    syncRemoteIntoLocal()
  } else {
    syncRemoteIntoLocal()
    syncLocalIntoRemote()
  }
}

export function SyncYJson<T extends JsonTemplateObject, RootState>(props: {
  yJson: Y.Map<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
}): null
export function SyncYJson<T extends JsonTemplateArray, RootState>(props: {
  yJson: Y.Array<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
}): null
export function SyncYJson<T extends JsonTemplateContainer, RootState>({
  yJson,
  setData,
  selectData,
}: {
  yJson: Y.Map<unknown> | Y.Array<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
}): null {
  const dispatch = useDispatch()
  const store = useStore()

  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const [origin] = useState<string>(() => `collaboration-kit:sync:${Math.random()}`)

  useEffect(() => {
    // Sync the current local state up to this point
    handleChange('local', store, selectData, setData, yJson)

    // Use store.subscribe to ensure we get synchronous updates. We cannot use `useSelector`, since that would
    // tie the updates to the react lifecycle, which may allow `yJson` to update before we push our changes.
    let stateCache: unknown = undefined
    const unsubscribe = store.subscribe(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument
      const newState = selectData(store.getState() as any)
      if (stateCache !== newState) {
        handleChange('local', store, selectData, setData, yJson)
        stateCache = newState
      }
    })

    return () => {
      // Explictly wrap this function call to avoid potential scoping bugs
      unsubscribe()
    }
  }, [selectData, setData, store, yJson])

  useEffect(() => {
    const observer = (ignore: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.origin === origin) return

      handleChange('remote', store, selectData, setData, yJson)
    }

    yJson.observeDeep(observer)

    return () => {
      yJson.unobserveDeep(observer)
    }
  }, [yJson, dispatch, setData, store, origin, selectData])

  return null
}
