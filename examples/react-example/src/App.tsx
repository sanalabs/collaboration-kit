import React from 'react'
import { Provider, useSelector } from 'react-redux'
import { selectData, store } from './store'

const Comp: React.VFC = () => {
  const data = useSelector(selectData)
  return <>selected data: {data}</>
}

function App() {
  return (
    <>
      <Provider store={store}>
        <Comp />
      </Provider>
    </>
  )
}

export default App
