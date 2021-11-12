import { SyncYMap } from '@sanalabs/y-redux'
import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import { debug } from './debug'
import { appSlice, Message, selectData } from './store'

const { yDoc, yProvider } = (() => {
  const yDoc = new Y.Doc()
  debug('Connecting webrtc provider')
  const yProvider = new WebrtcProvider('sana.example.chat', yDoc)

  return { yDoc, yProvider }
})()
debug('Created yjs provider', yProvider)
debug('Created yjs doc', yDoc)

const DisplayMessages = () => {
  const data = useSelector(selectData)
  const [yMap] = useState(() => yDoc.getMap('data'))

  const setData = useCallback((data: { messages: Message[] }) => {
    debug('Updating local data', JSON.stringify(data))
    return appSlice.actions.setData(data)
  }, [])
  return (
    <>
      <SyncYMap yMap={yMap} setData={setData} selectData={selectData} />
      Redux State:
      {JSON.stringify(data)}
    </>
  )
}

const AddMessage = () => {
  const dispatch = useDispatch()
  const [messageText, setMessageText] = useState<string>('')

  const sendMessage = useCallback(() => {
    if (messageText === '') return

    const message: Message = {
      id: `${Math.random()}`,
      text: messageText,
    }
    dispatch(appSlice.actions.addMessage(message))
    setMessageText('')
  }, [dispatch, setMessageText, messageText])

  return (
    <>
      <input
        type='text'
        placeholder='message'
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') sendMessage()
        }}
      />
      <button onClick={sendMessage}>Submit</button>
    </>
  )
}

function App() {
  const [destroyed, setDestroyed] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {!destroyed && (
        <>
          <DisplayMessages />
          <AddMessage />
        </>
      )}
      <button onClick={() => setDestroyed(destroyed => !destroyed)}>
        {destroyed ? 'restore' : 'destroy'}
      </button>
    </div>
  )
}

export default App
