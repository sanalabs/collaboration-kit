import { JsonObject } from '@sanalabs/json'
import _ from 'lodash'
import { useEffect } from 'react'
import { useStore } from 'react-redux'
import { AnyAction, Store } from 'redux'
import { Awareness } from 'y-protocols/awareness.js'
import { cachedSubscribe } from './redux-subscriber'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

const syncLocalIntoRemote = <T extends JsonObject>(awareness: Awareness, data: T | undefined): void => {
  if (data === undefined) {
    console.debug('[SyncYAwareness:syncLocalIntoRemote] Not syncing: Local data is undefined')
    return
  }

  console.debug('[SyncYAwareness:syncLocalIntoRemote] Syncing')
  awareness.setLocalState(data)
}

const syncRemoteIntoLocal = <T extends JsonObject>(
  awareness: Awareness,
  store: Store<any, AnyAction>,
  selectLocalAwarenessState: (state: any) => T | undefined,
  setAwarenessStates: (awarenessStates: (BaseAwarenessState & T)[]) => AnyAction,
): void => {
  const stateEntries = [...awareness.getStates().entries()]
  const states = stateEntries.map(([clientId, state]) => ({
    ...state,
    clientId,
    isCurrentClient: awareness.clientID === clientId,
  })) as (BaseAwarenessState & T)[]

  const latestReduxAwareness = selectLocalAwarenessState(store.getState())
  if (_.isEqual(states, latestReduxAwareness)) {
    console.debug('[SyncYAwareness:syncRemoteIntoLocal] Not syncing: Remote already equals local data')
    return
  }

  console.debug('[SyncYAwareness:syncRemoteIntoLocal] Syncing')
  store.dispatch(setAwarenessStates(states))
}

export const SyncYAwareness = <T extends JsonObject>({
  awareness,
  setAwarenessStates,
  selectLocalAwarenessState,
}: {
  awareness: Awareness
  setAwarenessStates: (awarenessStates: (BaseAwarenessState & T)[]) => AnyAction
  selectLocalAwarenessState: (state: any) => T | undefined
}): null => {
  const store = useStore()

  // On mount sync remote into local
  useEffect(() => {
    syncRemoteIntoLocal(awareness, store, selectLocalAwarenessState, setAwarenessStates)
  }, [awareness, selectLocalAwarenessState, setAwarenessStates, store])

  // Subscribe to local changes
  useEffect(() => {
    const unsubscribe = cachedSubscribe(store, selectLocalAwarenessState, data =>
      syncLocalIntoRemote(awareness, data),
    )

    return () => unsubscribe()
  }, [awareness, store, selectLocalAwarenessState])

  // Subscribe to remote changes
  useEffect(() => {
    const observer = (): void => {
      syncRemoteIntoLocal(awareness, store, selectLocalAwarenessState, setAwarenessStates)
    }

    awareness.on('change', observer)

    return () => {
      awareness.off('change', observer)
    }
  }, [awareness, selectLocalAwarenessState, setAwarenessStates, store])

  return null
}
