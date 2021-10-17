import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'

export const useYDoc = (): Y.Doc => {
  const [yDoc] = useState(() => new Y.Doc())

  useEffect(() => () => yDoc.destroy(), [yDoc])

  return yDoc
}

export const useYMap = <T>(yDoc: Y.Doc, key: string): Y.Map<T> =>
  useMemo<Y.Map<T>>(() => yDoc.getMap(key), [yDoc, key])
