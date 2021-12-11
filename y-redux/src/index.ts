import _ from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { AnyAction, Store } from 'redux'
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { JsonObject } from '../../json/src'
import { patchYJson } from '../../y-json/src'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

function sendChanges<T extends JsonObject, RootState>(
  store: Store,
  selectData: (state: RootState) => T | undefined,
  yMap: Y.Map<unknown>,
  origin: { origin: string },
) {
  return () => {
    // This hook patches the latest Redux data into the yDoc.
    // Note: this hook is triggered whenever the selector changes, and this selector
    // may update faster than this component can render. In such a case, there would be
    // a queue of states that would be patched into the yDoc. All of these states
    // (except the very latest) would be out of sync with the yDoc, and patching them in
    // would cause the old states to be redistributed to the other clients. In some cases
    // (especially with lots of state updates and  many clients), this would lead to infinite
    // loops which would crash the browser entirely. To fix this, we need to ensure that we
    // always patch the latest state from the Redux store into the yDoc.
    const latestRedux = selectData(store.getState() as RootState)
    if (latestRedux === undefined) {
      console.debug(
        '[SyncYMap] Redux data returned undefined. The data has most likely not been synced with the other clients yet.',
      )
      return
    }

    patchYJson(yMap, latestRedux, { origin })
  }
}

export const SyncYMap = <T extends JsonObject, RootState>({
  yMap,
  setData,
  selectData,
  throttleReceiveMs = 200,
  throttleSendMs = 200,
}: {
  yMap: Y.Map<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
  throttleReceiveMs?: number
  throttleSendMs?: number
}): null => {
  const dispatch = useDispatch()
  const localData = useSelector(selectData)
  const store = useStore()

  useEffect(() => {
    console.debug('[SyncYMap] start')
  }, [])

  useEffect(() => {
    console.debug('[SyncYMap] store changed')
  }, [store])

  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const [origin] = useState<string>(() => `collaboration-kit:sync:${Math.random()}`)

  const throttledSendChanges = useMemo(
    () => _.throttle(sendChanges(store, selectData, yMap, { origin }), throttleSendMs),
    [store, selectData, yMap, origin, throttleSendMs],
  )

  // Send changes whenever our local data changes
  useEffect(throttledSendChanges, [localData])

  useEffect(() => () => throttledSendChanges.flush(), [])

  useEffect(() => {
    const handler = (): void => {
      const newData = yMap.toJSON() as T

      if (_.isEqual(newData, {})) {
        // yMap is empty and most likely not yet synced
        return
      }

      const latestReduxData = selectData(store.getState() as RootState)

      if (_.isEqual(newData, latestReduxData)) {
        console.debug('[SyncYMap] remote data unchanged')
        return
      }

      console.debug('[SyncYMap] remote data changed')
      dispatch(setData(newData))
    }

    handler() // Run once on setup

    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.origin === origin) return
      handler()
    }

    const throttledObserver = _.throttle(observer, throttleReceiveMs)
    yMap.observeDeep(throttledObserver)

    return () => {
      throttledObserver.flush()
      yMap.unobserveDeep(throttledObserver)
    }
  }, [yMap, dispatch, setData, store, origin, throttleReceiveMs])

  return null
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
