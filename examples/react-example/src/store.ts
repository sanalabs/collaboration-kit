import {
  CombinedState,
  combineReducers,
  configureStore,
  createSelector,
  createSlice,
  PayloadAction,
  Reducer,
} from '@reduxjs/toolkit'
import { deepPatchJson } from '@sanalabs/y-redux/dist/cjs/json/src'
import { useDispatch } from 'react-redux'
import { debug } from './debug'

export type ReactionState = {
  [clientId: string]: { count: number }
}
export type ReactionStates = {
  [reaction: string]: ReactionState
}

export type Message = {
  id: string
  text: string
  clientId: number
  name: string
}

export type AppState = {
  messages: Message[]
  reactions: ReactionStates
}

const initialAppState: AppState = {
  messages: [],
  reactions: {},
}

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setData(state, { payload }: PayloadAction<AppState>) {
      debug('Performing actions.setData', 'payload', JSON.stringify(payload), 'state', JSON.stringify(state))
      deepPatchJson(state, payload)
    },

    addMessage(state, { payload }: PayloadAction<Message>) {
      debug(
        'Performing actions.addMessage, payload:',
        JSON.stringify(payload),
        'state: ',
        JSON.stringify(state),
      )
      state.messages.push(payload)
    },

    addReaction(
      state,
      { payload: { reaction, clientId } }: PayloadAction<{ reaction: string; clientId: number }>,
    ) {
      const client = `${clientId}`
      const reactionState: ReactionState = state.reactions[reaction] ?? {}
      state.reactions[reaction] = reactionState
      const clientReactionState: { count: number } = reactionState[client] ?? { count: 0 }
      reactionState[client] = clientReactionState

      clientReactionState.count++
    },
  },
})

export type RootState = {
  app: AppState
}

export const reducer: Reducer<CombinedState<RootState>> = combineReducers({
  app: appSlice.reducer,
})

export const store = configureStore({ reducer })

export type AppDispatch = typeof store.dispatch

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>()

const selectApp = (state: RootState): AppState => state.app

export const selectData = createSelector(selectApp, app => {
  debug('Selecting local data')
  return app
})

export const selectReactionState = createSelector(selectApp, app => app.reactions ?? {})
