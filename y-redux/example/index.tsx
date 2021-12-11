export {}

// import { useEffect, useMemo } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import * as Y from 'yjs'
// import { SyncYAwareness, SyncYJson } from '../src'
// import { setAwarenessStates, setData } from './actions'
// import { selectData, selectLocalAwarenessState } from './selectors'

// // redux state = { data1: 123, deepData: { data2: 123 } }

// const YRedux = (): JSX.Element => {
//   const dispatch = useDispatch()

//   // yDoc and yProvider have the same life cycle.
//   // useMemo may depend on data that is loaded dynamically (eg. auth token).
//   const { yDoc, yMap, yProvider } = useMemo(() => {
//     const yDoc = new Y.Doc()
//     const yMap = yDoc.getMap('data')
//     const yProvider = new WebrtcProvider(TODO)

//     return { yDoc, yMap, yProvider }
//   }, [])

//   // Destroy yDoc and yProvider on unmount.
//   useEffect(
//     () => () => {
//       dispatch(clearData())
//       dispatch(setAwarenessStates())
//       yDoc.destroy()
//       yProvider.destroy()
//     },
//     [yDoc, yProvider, dispatch],
//   )

//   return (
//     <>
//       <SyncYJson yMap={yMap} setData={setData} selectData={selectData} decodeData={decodeData} />
//       <SyncYAwareness
//         awareness={yProvider.awareness}
//         setAwarenessStates={setAwarenessStates}
//         selectLocalAwarenessState={selectLocalAwarenessState}
//         decodeLocalAwarenessState={decodeLocalAwarenessState}
//       />
//     </>
//   )
// }

// const Comp1 = (): JSX.Element => {
//   const dispatch = useDispatch()
//   const data1 = useSelector(selectData1)

//   return (
//     <div>
//       <p>Component 1 rendered at {new Date().toISOString()}</p>
//       <p>data1 = {data1}</p>
//       <p>
//         <button onClick={() => dispatch(setData1(Math.random()))}>Update 1</button>
//       </p>
//     </div>
//   )
// }

// const Comp2 = (): JSX.Element => {
//   const data2 = useSelector(selectData2)

//   return (
//     <div>
//       <p>Component 2 rendered at {new Date().toISOString()}</p>
//       <p>data2 = {data2}</p>
//       <p>
//         <button onClick={() => dispatch(setData1(Math.random()))}>Update 2</button>
//       </p>
//     </div>
//   )
// }

// export const App = (): JSX.Element => (
//   <>
//     <YRedux />

//     <p>The components re-render only when the data they depend on updates.</p>

//     <hr />
//     <Comp1 />

//     <hr />
//     <Comp2 />
//   </>
// )
