import { JsonObject } from '@sanalabs/json'
import _ from 'lodash'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { AnyAction, Store } from 'redux'
import { Awareness } from 'y-protocols/awareness.js'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

function sendLocalAwarenessState<T extends JsonObject>(
  awareness: Awareness,
  selectLocalAwarenessState: (state: any) => T | undefined,
  store: Store<any, AnyAction>,
  localAwarenessState: T | undefined,
) {
  return () => {
    const latestReduxAwareness = selectLocalAwarenessState(store.getState())
    if (latestReduxAwareness === undefined) return
    if (!_.isEqual(latestReduxAwareness, localAwarenessState)) {
      console.debug(
        '[SyncYAwareness] Data Race prevented. SyncYAwareness will read the latest state from Redux directly.',
      )
    }
    awareness.setLocalState(latestReduxAwareness)
  }
}

export const SyncYAwareness = <T extends JsonObject>({
  awareness,
  setAwarenessStates,
  selectLocalAwarenessState,
  throttleReceiveMs = 200,
  throttleSendMs = 200,
}: {
  awareness: Awareness
  setAwarenessStates: (awarenessStates: (BaseAwarenessState & T)[]) => void
  selectLocalAwarenessState: (state: any) => T | undefined
  throttleReceiveMs?: number
  throttleSendMs?: number
}): null => {
  const dispatch = useDispatch()
  const localAwarenessState = useSelector(selectLocalAwarenessState)
  const store = useStore()

  const throttledSendChanges = useMemo(
    () =>
      _.throttle(
        sendLocalAwarenessState(awareness, selectLocalAwarenessState, store, localAwarenessState),
        throttleSendMs,
      ),
    [awareness, selectLocalAwarenessState, store, localAwarenessState, throttleSendMs],
  )

  // Send changes whenever our local data changes
  useEffect(throttledSendChanges, [localAwarenessState])

  useEffect(() => () => throttledSendChanges.flush(), [])

  useEffect(() => {
    const handler = (): void => {
      const stateEntries = [...awareness.getStates().entries()]
      const states = stateEntries.map(([clientId, state]) => ({
        ...state,
        clientId,
        isCurrentClient: awareness.clientID === clientId,
      })) as (BaseAwarenessState & T)[]

      const latestReduxAwareness = selectLocalAwarenessState(store.getState())
      if (_.isEqual(states, latestReduxAwareness)) {
        console.debug('[SyncYAwareness] remote data unchanged')
        return
      }

      dispatch(setAwarenessStates(states))
    }

    handler() // Run once on setup

    const throttledHandler = _.throttle(handler, throttleReceiveMs)
    awareness.on('change', throttledHandler)

    return () => {
      awareness.off('change', throttledHandler)
      throttledHandler.flush()
    }
  }, [awareness, dispatch, setAwarenessStates])

  return null
}
