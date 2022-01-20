/**
 * @jest-environment jsdom
 */

import { patchYJson } from '@sanalabs/y-json'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React, { useEffect, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { createStore, Store } from 'redux'
import * as Y from 'yjs'
import { SyncYJson } from '../src/sync-y-json'

type Data = { bool: boolean; messages: string[] }

type State = { status: 'loading' } | { status: 'loaded'; data: Data }

type Action =
  | { type: 'toggle-bool' }
  | { type: 'send-message'; message: string }
  | { type: 'set-data'; data: Data }

const reducer = (state: State = { status: 'loading' }, action: Action): State => {
  switch (action.type) {
    case 'set-data':
      return { status: 'loaded', data: action.data }
    case 'toggle-bool':
      if (state.status !== 'loaded') throw new Error('Expected data to be laoded')
      return { ...state, data: { ...state.data, bool: !state.data.bool } }
    case 'send-message':
      if (state.status !== 'loaded') throw new Error('Expected data to be laoded')
      return { ...state, data: { ...state.data, messages: [...state.data.messages, action.message] } }
    default:
      return state
  }
}

const selectStatus = (state: State): State['status'] => state.status
const selectData = (state: State): Data | undefined => (state.status === 'loaded' ? state.data : undefined)

const Mock = ({ id }: { id: string }): null => {
  const dispatch = useDispatch()
  const counterRef = useRef(0)
  const status = useSelector(selectStatus)

  useEffect(() => {
    if (status !== 'loaded') return

    const send = (): Action => dispatch({ type: 'send-message', message: `${id}:${counterRef.current++}` })

    send()

    // setTimeout(send, 10)
  }, [status, id, dispatch])

  return null
}

const App = ({
  id,
  store,
  yJson,
}: {
  id: string
  store: Store<State, Action>
  yJson: Y.Map<unknown>
}): JSX.Element => (
  <Provider store={store}>
    <h1>Hello, World!</h1>
    <Mock id={id} />
    <SyncYJson
      yJson={yJson}
      setData={(data: Data): Action => ({ type: 'set-data', data })}
      selectData={selectData}
    />
  </Provider>
)

// const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

beforeEach(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

test('sync', async () => {
  const store1 = createStore(reducer)
  const store2 = createStore(reducer)

  // TODO: Simulate server and two clients, all synced with a provider
  const yDoc1 = new Y.Doc()
  const yMap1 = yDoc1.getMap()
  patchYJson(yMap1, { bool: false, messages: [] })

  render(<App id='1' store={store1} yJson={yMap1} />)
  render(<App id='2' store={store2} yJson={yMap1} />)

  expect(selectData(store1.getState())).not.toBe(undefined)
  expect(selectData(store1.getState())).toEqual(selectData(store2.getState()))
  expect(selectData(store1.getState())).toEqual(yMap1.toJSON())
})
