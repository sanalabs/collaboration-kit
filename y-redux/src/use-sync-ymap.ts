import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { JsonObject } from '../../json/src'
import { sync, SyncControls, SyncOptions } from '../../y-json/src'

export const useSyncYMap = <T extends JsonObject>(
  yType: Y.Map<T>,
  onRemoteDataChanged?: SyncOptions<T>['onRemoteDataChanged'],
  validate?: SyncOptions<T>['validate'],
): SyncControls<T>['updateLocalData'] => {
  const [updateLocalData, setUpdateLocalData] = useState<(_: T) => void>(() => {})

  useEffect(() => {
    const { disconnect, updateLocalData } = sync({ yType, onRemoteDataChanged, validate })
    setUpdateLocalData(updateLocalData)

    return disconnect
  }, [yType, setUpdateLocalData, validate, onRemoteDataChanged])

  return updateLocalData
}
