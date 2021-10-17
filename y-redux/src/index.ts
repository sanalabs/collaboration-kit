import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { patchYType } from '../../y-json/src'

export type BaseAwarenessState = {
  clientId: number
  isCurrentClient: boolean
}

export const SyncYMap = <T extends Record<string, unknown>>({
  yMap,
  setData,
  selectData,
}: {
  yMap: Y.Map<T>
  setData: (data: T) => any
  selectData: (...reduxState: any[]) => T | undefined
}): null => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)

  useEffect(() => {
    if (data === undefined) return
    patchYType(yMap, data)
  }, [yMap, data])

  useEffect(() => {
    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (!transaction.local) {
        dispatch(setData(yMap.toJSON()))
      }
    }

    yMap.observeDeep(observer)

    return () => yMap.unobserveDeep(observer)
  }, [yMap, dispatch, setData])

  return null
}

export const SyncYAwareness = <T extends Record<string, unknown>>({
  awareness,
  setAwarenessStates,
  selectLocalAwarenessState,
}: {
  awareness: Awareness
  setAwarenessStates: (awarenessStates: (BaseAwarenessState & T)[]) => void
  selectLocalAwarenessState: (reduxState: any) => T | undefined
  isValid?: (val: unknown) => val is T
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
