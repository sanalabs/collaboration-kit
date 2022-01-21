/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { patchYJson } from '@sanalabs/y-json'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { createStore, Store } from 'redux'
import * as Y from 'yjs'
import { SyncYJson } from '../src/sync-y-json'

type Data = { bool: boolean; messages: number[] }

type State = { status: 'loading' } | { status: 'loaded'; data: Data }

type Action =
  | { type: 'toggle-bool' }
  | { type: 'send-message'; message: number }
  | { type: 'set-data'; data: Data }

const reducer = (state: State = { status: 'loading' }, action: Action): State => {
  switch (action.type) {
    case 'set-data':
      return { status: 'loaded', data: action.data }
    case 'toggle-bool': {
      if (state.status !== 'loaded') throw new Error('Expected data to be laoded')
      return { ...state, data: { ...state.data, bool: !state.data.bool } }
    }
    case 'send-message':
      if (state.status !== 'loaded') throw new Error('Expected data to be laoded')
      return { ...state, data: { ...state.data, messages: [...state.data.messages, action.message] } }
    default:
      return state
  }
}

const selectStatus = (state: State): State['status'] => state.status
const selectData = (state: State): Data | undefined => (state.status === 'loaded' ? state.data : undefined)
const selectMessages = (state: State): number[] | undefined => selectData(state)?.messages

const DispatchMessages: React.VFC = () => {
  const dispatch = useDispatch()
  const counterRef = useRef(0)
  const status = useSelector(selectStatus)

  useEffect(() => {
    if (status !== 'loaded') return

    const send = (): void => {
      counterRef.current++
      dispatch({ type: 'send-message', message: counterRef.current })
    }
    setInterval(() => send())
  }, [status, dispatch])

  return null
}

const ToggleBoolean: React.VFC = () => {
  const dispatch = useDispatch()
  const status = useSelector(selectStatus)

  useEffect(() => {
    let count = 0
    if (status !== 'loaded') return

    const send = (): Action => dispatch({ type: 'toggle-bool' })

    const interval = setInterval(() => {
      send()
      if (count === 100) {
        clearInterval(interval)
      } else {
        count++
      }
    })
  }, [status, dispatch])

  return null
}

const App: React.FC<{
  store: Store<State, Action>
  yJson: Y.Map<unknown>
}> = ({ store, yJson, children }) => (
  <Provider store={store}>
    <h1>Hello, World!</h1>
    <SyncYJson
      yJson={yJson}
      setData={(data: Data): Action => ({ type: 'set-data', data })}
      selectData={selectData}
    />
    {children}
  </Provider>
)

// const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

beforeEach(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

const assertEndStates = ({ stores }: { stores: Store<State, Action>[] }): void => {
  console.log(
    'FINISHED WITH STATES:',
    stores.map(it => selectData(it.getState())?.messages),
  )

  for (const store of stores) {
    const messages = selectMessages(store.getState())
    expect(messages).toBeDefined()

    // Each `messages` array should be the list [1, 2, 3, ..., messages.length + 1]
    expect(messages).toEqual(_.range(1, messages!.length + 1))

    // Each `messages` array should have at least 5 elements, otherwise the test setup is probably wrong
    expect(messages!.length).toBeGreaterThan(4)

    // Ensure that all of the stores are in sync
    for (const otherStore of stores) {
      expect(store.getState()).toEqual(otherStore.getState())
    }
  }
}

const waitUntilFinished = ({ stores }: { stores: Store<State, Action>[] }): Promise<void> =>
  new Promise(res => {
    setTimeout(() => {
      res()
      assertEndStates({ stores })
    }, 1000)
  })

test('sync', async () => {
  const store1 = createStore(reducer)
  const store2 = createStore(reducer)

  // TODO: Simulate server and two clients, all synced with a provider
  const yDoc1 = new Y.Doc()
  const yMap1 = yDoc1.getMap()
  patchYJson(yMap1, { bool: false, messages: [] })

  render(
    <App store={store1} yJson={yMap1}>
      <DispatchMessages />
    </App>,
  )
  render(
    <App store={store2} yJson={yMap1}>
      <ToggleBoolean />
    </App>,
  )

  console.log('STORE CHECK')
  console.log(store1.getState())
  console.log(store2.getState())
  expect(store1.getState()).toEqual(store2.getState())

  expect(selectData(store1.getState())).not.toBe(undefined)
  expect(selectData(store1.getState())).toEqual(selectData(store2.getState()))
  expect(selectData(store1.getState())).toEqual(yMap1.toJSON())

  return waitUntilFinished({ stores: [store1, store2] })
})
