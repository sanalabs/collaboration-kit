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

export type Message = {
  id: string
  text: string
}

type AppState = { messages: Message[] }

const initialAppState: AppState = {
  messages: [],
}

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setData(state, { payload }: PayloadAction<{ messages: Message[] }>) {
      deepPatchJson(state, payload)
    },

    addMessage(state, { payload }: PayloadAction<Message>) {
      state.messages.push(payload)
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

export const selectData = createSelector(
  (state: RootState): AppState => state.app,
  app => app,
)
