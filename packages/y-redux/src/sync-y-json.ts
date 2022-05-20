import { JsonTemplateArray, JsonTemplateContainer, JsonTemplateObject } from '@sanalabs/json'
import { isEmpty, patchYJson } from '@sanalabs/y-json'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { Store } from 'redux'
import * as Y from 'yjs'
import { cachedSubscribe } from './redux-subscriber'

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

  if (isEmpty(yJson)) {
    console.debug(
      "[SyncYJson] Not syncing: Remote data is empty. The YDoc hasn't loaded yet, and syncing would overwrite remote data.",
    )
    return
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
  const store = useStore()

  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const [origin] = useState<string>(() => `collaboration-kit:sync:${Math.random()}`)

  // On mount sync remote into local
  useEffect(() => {
    handleChange('remote', store, selectData, setData, yJson)
  }, [store, selectData, setData, yJson])

  // Subscribe to local changes
  useEffect(() => {
    const unsubscribe = cachedSubscribe(store, selectData, () => {
      handleChange('local', store, selectData, setData, yJson)
    })

    return () => unsubscribe()
  }, [store, selectData, setData, yJson])

  // Subscribe to remote changes
  useEffect(() => {
    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.origin === origin) return
      handleChange('remote', store, selectData, setData, yJson)
    }

    yJson.observeDeep(observer)

    return () => {
      yJson.unobserveDeep(observer)
    }
  }, [origin, store, selectData, setData, yJson])

  return null
}
