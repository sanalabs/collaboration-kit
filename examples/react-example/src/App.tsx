import { SyncYMap } from '@sanalabs/y-redux'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import { debug } from './debug'
import { ReactionsDemo } from './reactions-demo'
import { appSlice, AppState, Message, selectData, store } from './store'

const yDoc = new Y.Doc()
debug('Connecting webrtc provider')
const yProvider = new WebrtcProvider('sana.example.chat', yDoc)
debug('Created yjs provider', yProvider)
debug('Created yjs doc', yDoc)

const Loop: React.FC = () => {
  useEffect(() => {
    setTimeout(() => {
      // console.debug('[SyncYMap] patching in loop data 1')
      // patchYType(yDoc.getMap('data'), {
      //   messages: [{ id: '1', text: '1', client: 1, name: '1' }],
      //   reactions: {},
      // })
      // console.debug('[SyncYMap] patching in loop data 2')
      // patchYType(yDoc.getMap('data'), {
      //   messages: [{ id: '2', text: '2', client: 2, name: '2' }],
      //   reactions: {},
      // })
      // patchYType(yDoc.getMap('data'), {
      //   messages: [{ id: Math.random(), text: 'Hello humans', client: 1234, name: 'Sana Bot 🤖' }],
      //   reactions: {},
      // })
      // const messages: AppState['messages'] = []
      // _.range(0, 100)
      //   .map((i): Message => ({ id: `${i}`, text: `${i}`, clientId: i, name: `${i}` }))
      //   .forEach(message => {
      //     messages.push(message)
      //     console.debug('[SyncYMap] patching in loop data 2')
      //     patchYType(yDoc.getMap('data'), { messages, reactions: {} })
      //   })
    }, 1000)
  }, [])

  // export type Message = {
  //   id: string
  //   text: string
  //   clientId: number
  //   name: string
  // }

  // export type AppState = {
  //   messages: Message[]
  //   reactions: ReactionStates
  // }
  return null
}

const ChatProvider: React.FC = ({ children }) => {
  const [yMap] = useState(() => yDoc.getMap('data'))
  const setData = useCallback((data: AppState) => {
    debug('Updating local data', JSON.stringify(data))
    return appSlice.actions.setData(data)
  }, [])

  return (
    <>
      <SyncYMap yMap={yMap} setData={setData} selectData={selectData} getState={store.getState} />
      {children}
    </>
  )
}

const hasDuplicates = (array: readonly string[]): boolean => array.length !== new Set(array).size

const getDuplicates = (array: readonly string[]): readonly string[] =>
  Array.from(new Set(array.filter((v, i, a) => a.indexOf(v) !== i)))

const LoopDetector: React.VFC = () => {
  const data = useSelector(selectData)
  useEffect(() => {
    if (data === undefined || data.messages === undefined) return
    const ids = data.messages.map(it => it.id)
    if (hasDuplicates(ids)) {
      throw new Error(`[LOOP DETECTED]
      Duplicate ids detected in messages.
      Duplicates: ${getDuplicates(ids)}
      Messages: ${JSON.stringify(data.messages)}`)
    }
  }, [data])
  return null
}

const DisplayMessages: React.VFC = () => {
  const data = useSelector(selectData)
  const latestMessageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (latestMessageRef.current === null) return

    const element = latestMessageRef.current
    element.scrollIntoView({ behavior: 'smooth' })
  }, [latestMessageRef])

  return (
    <div style={{ flexGrow: 1 }}>
      {data?.messages?.map(message => (
        <div ref={latestMessageRef} key={message.id} style={{ display: 'flex', alignItems: 'center' }}>
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
    </div>
  )
}

const ReduxState: React.VFC = () => {
  const data = useSelector(selectData)
  return <div>Redux State:{JSON.stringify(data)}</div>
}

const Initialize: React.VFC = () => {
  const dispatch = useDispatch()
  const data = useSelector(selectData)
  return data !== undefined ? null : (
    <div>
      <button
        onClick={() => {
          const initialState = { reactions: {}, messages: [] }
          console.debug('Resetting state:', initialState)
          dispatch(appSlice.actions.setData(initialState))
        }}
      >
        Initialize Redux state
      </button>
    </div>
  )
}

const readNameFromLocalStorage = (): string | null => window.localStorage.getItem('name')
const setNameInLocalStorage = (newName: string): void => {
  window.localStorage.setItem('name', newName)
}

const Controls = () => {
  const data = useSelector(selectData)
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
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: 'white',
        borderTop: '1px solid black',
        padding: '16px',
        paddingBottom: '128px',
      }}
    >
      <Initialize />

      <div style={{ marginTop: '16px' }}>
        <input type='text' placeholder='name' value={name} onChange={e => updateName(e.target.value)} />
      </div>
      <input
        type='text'
        placeholder={hasName ? 'message' : 'enter a name first'}
        disabled={!hasName || data === undefined}
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') sendMessage()
        }}
      />
      <button onClick={sendMessage}>Submit</button>
    </div>
  )
}

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ChatProvider>
        <DisplayMessages />
      </ChatProvider>
      <Controls />
      <ReactionsDemo clientId={yDoc.clientID} />
      {/* <ReduxState /> */}

      <Loop />
      <LoopDetector />
    </div>
  )
}

export default App
