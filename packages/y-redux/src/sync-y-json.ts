import { JsonTemplateArray, JsonTemplateContainer, JsonTemplateObject } from '@sanalabs/json'
import { patchYJson } from '@sanalabs/y-json'
import _ from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Store } from 'redux'
import * as Y from 'yjs'

function sendChanges<T extends JsonTemplateContainer, RootState>(
  store: Store,
  selectData: (state: RootState) => T | undefined,
  yJson: Y.Map<unknown> | Y.Array<unknown>,
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
        '[SyncYJson] Redux data returned undefined. The data has most likely not been synced with the other clients yet.',
      )
      return
    }

    patchYJson(yJson, latestRedux, { origin })
  }
}

export function SyncYJson<T extends JsonTemplateObject, RootState>(props: {
  yJson: Y.Map<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
  throttleReceiveMs?: number
  throttleSendMs?: number
}): null
export function SyncYJson<T extends JsonTemplateArray, RootState>(props: {
  yJson: Y.Array<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
  throttleReceiveMs?: number
  throttleSendMs?: number
}): null
export function SyncYJson<T extends JsonTemplateContainer, RootState>({
  yJson,
  setData,
  selectData,
  throttleReceiveMs = 200,
  throttleSendMs = 200,
}: {
  yJson: Y.Map<unknown> | Y.Array<unknown>
  setData: (data: T) => any
  selectData: (state: RootState) => T | undefined
  throttleReceiveMs?: number
  throttleSendMs?: number
}): null {
  const dispatch = useDispatch()
  const localData = useSelector(selectData)
  const store = useStore()

  useEffect(() => {
    console.debug('[SyncYJson] start')
  }, [])

  useEffect(() => {
    console.debug('[SyncYJson] store changed')
  }, [store])

  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const [origin] = useState<string>(() => `collaboration-kit:sync:${Math.random()}`)

  const throttledSendChanges = useMemo(
    () => _.throttle(sendChanges(store, selectData, yJson, { origin }), throttleSendMs),
    [store, selectData, yJson, origin, throttleSendMs],
  )

  // Send changes whenever our local data changes
  useEffect(throttledSendChanges, [localData])

  useEffect(() => () => throttledSendChanges.flush(), [])

  useEffect(() => {
    const handler = (): void => {
      const newData = yJson.toJSON() as T

      if (_.isEqual(newData, {})) {
        // yJson is empty and most likely not yet synced
        return
      }

      const latestReduxData = selectData(store.getState() as RootState)

      if (_.isEqual(newData, latestReduxData)) {
        console.debug('[SyncYJson] remote data unchanged')
        return
      }

      console.debug('[SyncYJson] remote data changed')
      dispatch(setData(newData))
    }

    handler() // Run once on setup

    const observer = (events: Array<Y.YEvent>, transaction: Y.Transaction): void => {
      if (transaction.origin === origin) return
      handler()
    }

    const throttledObserver = _.throttle(observer, throttleReceiveMs)
    yJson.observeDeep(throttledObserver)

    return () => {
      throttledObserver.flush()
      yJson.unobserveDeep(throttledObserver)
    }
  }, [yJson, dispatch, setData, store, origin, throttleReceiveMs])

  return null
}
