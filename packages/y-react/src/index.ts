import {
  JsonArray,
  JsonContainer,
  JsonObject,
  JsonTemplateArray,
  JsonTemplateContainer,
  JsonTemplateObject,
} from '@sanalabs/json'
import { patchYJson } from '@sanalabs/y-json'
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import * as Y from 'yjs'

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const unsafeTypeCoersion = <T>(val: any): T => val

export function useYJson<S extends JsonTemplateObject = JsonObject>(
  yJson: Y.Map<unknown>,
): [S, Dispatch<SetStateAction<S>>]
export function useYJson<S extends JsonTemplateArray = JsonArray>(
  yJson: Y.Array<unknown>,
): [S, Dispatch<SetStateAction<S>>]
export function useYJson<S extends JsonTemplateContainer = JsonContainer>(
  yJson: Y.Map<unknown> | Y.Array<unknown>,
): [S, Dispatch<SetStateAction<S>>] {
  // The origin of the yjs transactions committed by collaboration-kit
  // For context see: https://discuss.yjs.dev/t/determining-whether-a-transaction-is-local/361/3
  const [origin] = useState<string>(() => `collaboration-kit:sync:${Math.random()}`)

  const [data, setDataInternal] = useState<S>(unsafeTypeCoersion(yJson.toJSON()))

  useEffect(() => {
    const handler = (): void => setDataInternal(unsafeTypeCoersion(yJson.toJSON()))

    yJson.observeDeep(handler)

    return () => yJson.unobserveDeep(handler)
  }, [origin, yJson])

  const setData = useCallback(
    (arg: SetStateAction<S>) => {
      const newData = typeof arg === 'function' ? arg(unsafeTypeCoersion(yJson.toJSON())) : arg
      patchYJson(yJson, newData, { origin })
    },
    [origin, yJson],
  )

  return [data, setData]
}
