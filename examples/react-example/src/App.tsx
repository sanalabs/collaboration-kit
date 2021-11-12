import { SyncYMap } from '@sanalabs/y-redux'
import { JsonObject } from '@sanalabs/y-redux/dist/cjs/json/src'
import { useCallback, useEffect, useMemo } from 'react'
import { Provider, useSelector } from 'react-redux'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import { appSlice, selectData, store } from './store'

const Comp = () => {
  const data = useSelector(selectData)

  const { yDoc, yMap, yProvider } = useMemo(() => {
    const yDoc = new Y.Doc()
    const yMap: Y.Map<JsonObject> = yDoc.getMap('data')
    const yProvider = new WebrtcProvider('test-jeppes', yDoc)

    return { yDoc, yMap, yProvider }
  }, [])

  useEffect(
    () => () => {
      yDoc.destroy()
      yProvider.destroy()
    },
    [yDoc, yProvider],
  )

  const setData = useCallback((data: JsonObject) => appSlice.actions.setData(data), [])
  console.log(yDoc)
  return (
    <>
      <SyncYMap yMap={yMap} setData={setData} selectData={selectData} />
      selected data:
      {JSON.stringify(data)}
    </>
  )
}

function App() {
  return (
    <>
      <Provider store={store}>
        <Comp />
      </Provider>
    </>
  )
}

export default App
