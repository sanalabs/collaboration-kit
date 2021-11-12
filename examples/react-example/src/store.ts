import {
  CombinedState,
  combineReducers,
  configureStore,
  createSelector,
  createSlice,
  PayloadAction,
  Reducer,
} from '@reduxjs/toolkit'
import { JsonObject } from '@sanalabs/y-redux/dist/cjs/json/src'
import { useDispatch } from 'react-redux'

type AppState = { data: JsonObject }

const initialAppState: AppState = {
  data: { arr: ['hej'] },
}

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setData(state, { payload }: PayloadAction<JsonObject>) {
      return { data: payload }
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
  app => app.data,
)
