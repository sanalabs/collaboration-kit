import _ from 'lodash'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { JsonObject } from '../../json/src'
import { patchYType } from '../../y-json/src'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

export const SyncYMap = <T extends JsonObject>({
  yMap,
  setData,
  selectData,
}: {
  yMap: Y.Map<T>
  setData: (data: T) => any
  selectData: (state: any) => T | undefined
}): null => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)
  const dataRef = useRef(data)

  useEffect(() => {
    if (data === undefined) return
    if (_.isEqual(data, dataRef.current)) return

    dataRef.current = data
    patchYType(yMap, data)
  }, [yMap, data])

  useEffect(() => {
    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.local) return
      const newData = yMap.toJSON() as T
      if (_.isEqual(newData, dataRef.current)) return

      dispatch(setData(yMap.toJSON() as T))
    }

    yMap.observeDeep(observer)

    return () => yMap.unobserveDeep(observer)
  }, [yMap, dispatch, setData])

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
