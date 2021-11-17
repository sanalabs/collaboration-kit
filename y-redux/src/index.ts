import { patchYType } from '@sanalabs/y-json'
import _ from 'lodash'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
  getState,
}: {
  yMap: Y.Map<T>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
  getState: () => RootState
}): null => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)

  useEffect(() => {
    console.debug('[SyncYMap] start')
  }, [])

  useEffect(() => {
    // The latest data from the selector is not necessarily the latest data from Redux.
    // TODO: find out how to best get the latest state from Redux directly.
    const latestData = selectData(getState())
    if (!_.isEqual(latestData, data)) {
      console.debug('[SyncYMap] Race detected!! SyncYMap is not rendering with the latest data from redux.')
    }
    if (latestData === undefined) {
      console.debug('[SyncYMap] local data undefined')
      return
    }

    console.debug('[SyncYMap] patch', JSON.stringify(latestData), `time: ${Date.now()}`)
    patchYType(yMap, latestData)
  }, [yMap, data])

  useEffect(() => {
    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      // if (transaction.local) return
      const newData = yMap.toJSON() as T
      const latestReduxData = selectData(getState())
      if (_.isEqual(newData, latestReduxData)) {
        console.debug('[SyncYMap] remote data unchanged')
        return
      }

      console.debug('[SyncYMap] remote changed', JSON.stringify(newData))
      dispatch(setData(newData))
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
