import { SyncYMap } from '@sanalabs/y-redux'
import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import { debug } from './debug'
import { ReactionsDemo } from './reactions-demo'
import { appSlice, AppState, Message, selectData } from './store'

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

  const setData = useCallback((data: AppState) => {
    debug('Updating local data', JSON.stringify(data))
    return appSlice.actions.setData(data)
  }, [])
  return (
    <>
      <SyncYMap yMap={yMap} setData={setData} selectData={selectData} />
      {data.messages?.map(message => (
        <div key={message.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '100',
              textAlign: 'center',
              background: 'rgba(100, 100, 100, 0.1)',
              marginRight: '4px',
              marginBottom: '4px',
              padding: '4px',
            }}
          >
            <small>
              <strong>{message.name ?? message.clientId}</strong>
            </small>
          </div>
          {message.text}
        </div>
      ))}
    </>
  )
}

const ReduxState: React.VFC = () => {
  const data = useSelector(selectData)
  return <div>Redux State:{JSON.stringify(data)}</div>
}

const DestroyReduxState: React.VFC = () => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)
  return (
    <div>
      <button onClick={() => dispatch(appSlice.actions.setData({ ...data, messages: [] }))}>
        Delete all messages
      </button>
    </div>
  )
}

const DestroyMyMessages: React.VFC = () => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)
  return (
    <div>
      <button
        onClick={() =>
          dispatch(
            appSlice.actions.setData({
              ...data,
              messages: data.messages.filter(it => it.clientId !== yDoc.clientID),
            }),
          )
        }
      >
        Delete my messages
      </button>
    </div>
  )
}

const readNameFromLocalStorage = (): string | null => window.localStorage.getItem('name')
const setNameInLocalStorage = (newName: string): void => {
  window.localStorage.setItem('name', newName)
}

const Controls = () => {
  const dispatch = useDispatch()
  const [messageText, setMessageText] = useState<string>('')
  const [name, setName] = useState<string>(() => readNameFromLocalStorage() ?? '')

  const updateName = (newName: string) => {
    setNameInLocalStorage(newName)
    setName(newName)
  }

  const sendMessage = useCallback(() => {
    if (messageText === '') return

    const message: Message = {
      id: `${Math.random()}`,
      text: messageText,
      clientId: yDoc.clientID,
      name: name ?? `${yDoc.clientID}`,
    }
    dispatch(appSlice.actions.addMessage(message))
    setMessageText('')
  }, [dispatch, setMessageText, messageText, name])
  const hasName = name !== undefined && name.replace(/\s/g, '') !== ''

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: 'white',
        borderTop: '1px solid black',
        padding: '16px',
      }}
    >
      <div>
        <input type='text' placeholder='name' value={name} onChange={e => updateName(e.target.value)} />
      </div>
      <input
        type='text'
        placeholder={hasName ? 'message' : 'enter a name first'}
        disabled={!hasName}
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') sendMessage()
        }}
      />
      <button onClick={sendMessage}>Submit</button>
      <DestroyReduxState />
      <DestroyMyMessages />
    </div>
  )
}

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <DisplayMessages />
      <Controls />
      <ReactionsDemo clientId={yDoc.clientID} />
      <ReduxState />
    </div>
  )
}

export default App
