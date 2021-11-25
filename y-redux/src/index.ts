import { patchYType } from '@sanalabs/y-json'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { JsonObject } from '../../json/src'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

export const SyncYMap = <T extends JsonObject, RootState>({
  yMap,
  setData,
  selectData,
}: {
  yMap: Y.Map<T>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
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

  useEffect(() => {
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
    if (!_.isEqual(latestRedux, localData)) {
      console.debug(
        '[SyncYMap] Data Race prevented. SyncYmap will read the latest state from Redux directly.',
      )
    }
    if (latestRedux === undefined) {
      console.debug(
        '[SyncYMap] Redux data returned undefined. The data has most likely not been synced with the other clients yet.',
      )
      return
    }

    patchYType(yMap, latestRedux, { origin })
  }, [yMap, localData, store, selectData, origin])

  useEffect(() => {
    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.origin === origin) return

      const newData = yMap.toJSON() as T
      const latestReduxData = selectData(store.getState() as RootState)

      if (_.isEqual(newData, latestReduxData)) {
        console.debug('[SyncYMap] remote data unchanged')
        return
      }

      console.debug('[SyncYMap] remote data changed')
      dispatch(setData(newData))
    }

    yMap.observeDeep(observer)

    return () => yMap.unobserveDeep(observer)
  }, [yMap, dispatch, setData, store, origin])

  return null
}

export const SyncYAwareness = <T extends JsonObject>({
  awareness,
  setAwarenessStates,
  selectLocalAwarenessState,
}: {
  awareness: Awareness
  setAwarenessStates: (awarenessStates: (BaseAwarenessState & T)[]) => void
  selectLocalAwarenessState: (state: any) => T | undefined
}): null => {
  const dispatch = useDispatch()
  const localAwarenessState = useSelector(selectLocalAwarenessState)
  const store = useStore()

  useEffect(() => {
    const latestReduxAwareness = selectLocalAwarenessState(store.getState())
    if (latestReduxAwareness === undefined) return
    if (!_.isEqual(latestReduxAwareness, localAwarenessState)) {
      console.debug(
        '[SyncYAwareness] Data Race prevented. SyncYAwareness will read the latest state from Redux directly.',
      )
    }
    awareness.setLocalState(latestReduxAwareness)
  }, [awareness, localAwarenessState, store, selectLocalAwarenessState])

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

    handler()

    awareness.on('change', handler)

    return () => awareness.off('change', handler)
  }, [awareness, dispatch, setAwarenessStates])

  return null
}
