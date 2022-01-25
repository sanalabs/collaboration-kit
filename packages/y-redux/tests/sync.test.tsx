/**
 * @jest-environment jsdom
 */
import { patchYJson } from '@sanalabs/y-json'
import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import _ from 'lodash'
import React, { useEffect } from 'react'
import { Provider, useDispatch, useSelector, useStore } from 'react-redux'
import { createStore, Store } from 'redux'
import * as Y from 'yjs'
import { SyncYJson } from '../src/sync-y-json'

type Data = { messages: number[]; count: number }

type State = { status: 'loading' } | { status: 'loaded'; data: Data }

type Action =
  | { type: 'increment'; expectedCount: number }
  | { type: 'send-message'; message: number }
  | { type: 'set-data'; data: Data }

const initialState: State = { status: 'loading' }

const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'set-data':
      return { status: 'loaded', data: action.data }
    case 'increment': {
      if (state.status !== 'loaded') throw new Error('Expected data to be loaded')

      const newState = { ...state, data: { ...state.data, count: state.data.count + 1 } }

      expect(newState.data.count).toEqual(action.expectedCount)

      return newState
    }
    case 'send-message': {
      if (state.status !== 'loaded') throw new Error('Expected data to be loaded')

      const newState = {
        ...state,
        data: { ...state.data, messages: [...state.data.messages, action.message] },
      }

      expect(state.data.messages).toEqual(_.range(1, action.message))

      return newState
    }
    default:
      return state
  }
}

const selectStatus = (state: State): State['status'] => state.status
const selectData = (state: State): Data | undefined => (state.status === 'loaded' ? state.data : undefined)
const selectMessages = (state: State): number[] | undefined => selectData(state)?.messages
const selectCount = (state: State): number | undefined => selectData(state)?.count

const startCount = 1
const endCount = 100

/**
 * This appends the messages 1, 2, 3, ..., endCount to the state.data.messages array, one element at a time.
 */
const DispatchMessages: React.VFC = () => {
  const dispatch = useDispatch()
  const status = useSelector(selectStatus)
  const store = useStore()

  useEffect(() => {
    if (status !== 'loaded') return

    let count = startCount
    const interval = setInterval(() => {
      dispatch({ type: 'send-message', message: count })
      count++
      if (count >= endCount) {
        clearInterval(interval)
      }
    })
    return () => clearInterval(interval)
  }, [status, dispatch, store])

  return null
}

/**
 * This increments the state.data.count counter from 0 upwards until the test has ended.
 */
const IncrementCounter: React.VFC = () => {
  const dispatch = useDispatch()
  const status = useSelector(selectStatus)
  const store = useStore()

  useEffect(() => {
    if (status !== 'loaded') return

    let count = 0
    const interval = setInterval(() => {
      dispatch({ type: 'increment', expectedCount: count + 1 })
      count++
    })
    return () => clearInterval(interval)
  }, [status, dispatch, store])

  return null
}

const SyncStore: React.FC<{
  store: Store<State, Action>
  yJson: Y.Map<unknown>
}> = ({ store, yJson, children }) => (
  <Provider store={store}>
    <SyncYJson
      yJson={yJson}
      setData={(data: Data): Action => ({ type: 'set-data', data })}
      selectData={selectData}
    />
    {children}
  </Provider>
)

beforeEach(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

test('sync', async () => {
  const store1 = createStore(reducer)
  const store2 = createStore(reducer)

  // TODO: Simulate server and two clients, all synced with a provider
  const yDoc1 = new Y.Doc()
  const yMap1 = yDoc1.getMap()
  patchYJson(yMap1, { count: 0, messages: [] })

  // We are simulating two clients. One client addds messages to an array of messages and the other increments
  // a counter. These are modifying separate parts of the state, so they should both see a consistent view of
  // their respective parts of the state throughout the test. At the end of the test, both of their redux stores
  // should be in sync.
  render(
    <SyncStore store={store1} yJson={yMap1}>
      <DispatchMessages />
    </SyncStore>,
  )
  render(
    <SyncStore store={store2} yJson={yMap1}>
      <IncrementCounter />
    </SyncStore>,
  )

  await waitFor(() => {
    // The test is finished when:
    // 1. state.data.messages contains the numbers 1 to 100 in order
    // 2. state.data.count has been incremented some number of times
    // 3. store1 and store2 are in fully in sync
    expect(selectMessages(store1.getState())).toEqual(_.range(startCount, endCount))
    expect(selectCount(store1.getState())).toBeGreaterThan(0)
    expect(store1.getState()).toEqual(store2.getState())
  })
})

test('warn on empty initial state', async () => {
  const store = createStore(reducer)

  const yDoc = new Y.Doc()
  const yMap = yDoc.getMap()

  const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()

  render(
    <SyncStore store={store} yJson={yMap}>
      <DispatchMessages />
    </SyncStore>,
  )

  expect(console.warn).toHaveBeenCalledTimes(1)
  consoleWarnMock.mockRestore()

  expect(store.getState()).toEqual(initialState)
})
