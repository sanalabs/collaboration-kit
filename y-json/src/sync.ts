import * as Y from 'yjs'
import { patchYType } from '.'
import { JsonObject } from '../../json/src'

const coerceType = <T>(val: unknown): asserts val is T => {}

type Validate<T> = (val: unknown) => asserts val is T

export type SyncOptions<Data> = {
  yType: Y.Map<Data>
  onRemoteDataChanged?: (data: Data) => void
  validate?: Validate<Data>
}

export type SyncControls<Data> = {
  disconnect: () => void
  updateLocalData: (data: Data) => void
}

export const sync = <Data extends JsonObject>({
  yType: yType,
  onRemoteDataChanged = () => {},
  validate = coerceType,
}: SyncOptions<Data>): SyncControls<Data> => {
  const check: Validate<Data> = validate

  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const origin = `collaboration-kit:sync:${Math.random()}`

  const observer = (ignored: Y.YEvent[], transaction: Y.Transaction): void => {
    if (transaction.origin !== origin) {
      const newData: unknown = yType.toJSON()
      check(newData)
      onRemoteDataChanged(newData)
    }
  }

  let isConnected = true
  const connect = (): void => {
    yType.observeDeep(observer)
    isConnected = true
  }
  connect()

  const updateLocalData: SyncControls<Data>['updateLocalData'] = data => {
    if (!isConnected) throw new Error('Cannot call `updateLocalData` after `disconnect`')

    check(data)
    patchYType(yType, data, { origin })
  }

  const disconnect: SyncControls<Data>['disconnect'] = () => {
    if (!isConnected) throw new Error('Cannot call `disconnect` more than once')

    yType.unobserveDeep(observer)
    isConnected = false
  }

  return {
    disconnect,
    updateLocalData,
  }
}
