import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { JsonObject } from '../../json/src'
import { SyncOptions } from '../../y-json/src'
import { useSyncYMap } from './use-sync-ymap'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

export const SyncYMap = <T extends JsonObject>({
  yMap,
  setData,
  selectData,
  validate,
}: {
  yMap: Y.Map<T>
  setData: (data: T) => any
  selectData: (state: any) => T | undefined
  validate?: SyncOptions<T>['validate']
}): null => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)

  const onRemoteDataChanged = useCallback((t: T): unknown => dispatch(setData(t)), [dispatch, setData])
  const updateRemoteData = useSyncYMap(yMap, onRemoteDataChanged, validate)

  useEffect(() => data && updateRemoteData(data), [data, updateRemoteData])

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

  useEffect(() => {
    if (localAwarenessState === undefined) return
    awareness.setLocalState(localAwarenessState)
  }, [awareness, localAwarenessState])

  useEffect(() => {
    const handler = (): void => {
      const stateEntries = [...awareness.getStates().entries()]
      const states = stateEntries.map(([clientId, state]) => ({
        ...state,
        clientId,
        isCurrentClient: awareness.clientID === clientId,
      })) as (BaseAwarenessState & T)[]

      dispatch(setAwarenessStates(states))
    }

    handler()

    awareness.on('change', handler)

    return () => awareness.off('change', handler)
  }, [awareness, dispatch, setAwarenessStates])

  return null
}
