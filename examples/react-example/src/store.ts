import {
  CombinedState,
  combineReducers,
  configureStore,
  createSelector,
  createSlice,
  Reducer,
} from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'

type AppState = { data: string }

const initialAppState: AppState = {
  data: 'hej',
}

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {},
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
