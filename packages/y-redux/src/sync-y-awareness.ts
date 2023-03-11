import { JsonObject } from '@sanalabs/json'
import _ from 'lodash'
import { useEffect } from 'react'
import { useStore } from 'react-redux'
import { AnyAction, Store } from 'redux'
import { Awareness } from 'y-protocols/awareness.js'
import { cachedSubscribe } from './redux-subscriber'

export type BaseAwarenessState = {
  clientId: number
}

export type AwarenessStates<T extends JsonObject> = Record<number, BaseAwarenessState & T>

const syncLocalIntoRemote = <T extends JsonObject>(awareness: Awareness, data: T | undefined): void => {
  if (data === undefined) {
    console.debug('[SyncYAwareness:syncLocalIntoRemote] Not syncing: Local data is undefined')
    return
  }

  console.debug('[SyncYAwareness:syncLocalIntoRemote] Syncing')
  awareness.setLocalState(data)
}

const syncRemotePeersIntoLocal = <T extends JsonObject>(
  awareness: Awareness,
  store: Store<any, AnyAction>,
  selectPeerAwarenessStates: (state: any) => AwarenessStates<T>,
  setPeerAwarenessStates: (awarenessStates: AwarenessStates<T>) => AnyAction,
): void => {
  const entryList = Array.from(awareness.getStates().entries())
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([clientId, state]) => [clientId, { ...state, clientId }])
  const peerStates = Object.fromEntries(entryList) as AwarenessStates<T>

  const latestReduxPeerAwarenesses = selectPeerAwarenessStates(store.getState())

  if (_.isEqual(peerStates, latestReduxPeerAwarenesses)) {
    console.debug(
      '[SyncYAwareness:syncRemoteIntoLocal] Not syncing peer states: Remote already equals local data',
    )
  } else {
    console.debug('[SyncYAwareness:syncRemoteIntoLocal] Syncing peer states')
    store.dispatch(setPeerAwarenessStates(peerStates))
  }
}

export const SyncYAwareness = <T extends JsonObject>({
  awareness,
  selectLocalAwarenessState,
  selectPeerAwarenessStates,
  setPeerAwarenessStates,
}: {
  awareness: Awareness
  selectLocalAwarenessState: (state: any) => T | undefined
  selectPeerAwarenessStates: (state: any) => AwarenessStates<T>
  setPeerAwarenessStates: (awarenessStates: AwarenessStates<T>) => AnyAction
}): null => {
  const store = useStore()

  // On mount sync remote peers into local
  useEffect(() => {
    syncRemotePeersIntoLocal(awareness, store, selectPeerAwarenessStates, setPeerAwarenessStates)
  }, [awareness, store, selectPeerAwarenessStates, setPeerAwarenessStates])

  // Subscribe to local changes
  useEffect(() => {
    const unsubscribe = cachedSubscribe(store, selectLocalAwarenessState, data =>
      syncLocalIntoRemote(awareness, data),
    )

    return () => unsubscribe()
  }, [awareness, store, selectLocalAwarenessState])

  // Subscribe to remote peer changes
  useEffect(() => {
    const observer = (): void => {
      syncRemotePeersIntoLocal(awareness, store, selectPeerAwarenessStates, setPeerAwarenessStates)
    }

    awareness.on('change', observer)

    return () => {
      awareness.off('change', observer)
    }
  }, [awareness, store, selectPeerAwarenessStates, setPeerAwarenessStates])

  return null
}
