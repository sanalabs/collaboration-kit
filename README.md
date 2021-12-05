# Collaboration Kit

Monorepo for packages that facilitate working with arbitrary JSON structures in [Yjs](https://github.com/yjs/yjs).

- `@sanalabs/y-react` Two-way sync of React state (TODO Jesper)
- `@sanalabs/y-redux` Two-way sync of Redux and Yjs
- `@sanalabs/y-json` Utility functions to mutate Yjs types according to a target JSON object
- `@sanalabs/json` Utility functions to validate and mutate JSON (patch and merge)

## Notes

### No excessive package dependencies

Collaboration Kit is split into multiple smaller packages so that excessive package dependencies can be avoided. You probably don't want to install React on your backend.

### Peer dependencies

A number of dependencies (react, redux, yjs) are [peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies). Otherwise, strange runtime bugs will occur due to version incompatibilities.

# @sanalabs/y-redux

The package exports a React component SyncYMap that acts as a two-way synchronization of a Redux state and a YMap. When SyncYMap is mounted it keeps the state in sync by:

1. Listening for changes to the YMap (observeDeep) and writing them to the Redux state (dispatching an action).
2. Listening for changes to the Redux state (useSelector) and writing them to the Ymap (Yjs mutation operations).

The YMap can be a deep structure containing YMaps, YArrays and JSON primitives.

The Yjs mutations are batched into a transaction and are optimized to only touch the part of the state that changed.

In addition one can use Immer (Redux Toolkit provides this out of the box) which allows the Yjs-to-Redux updates to be optimized and retain object references for parts of the state that don't change. We achieve this by using a function deepPatchJson that is also exported by Collaboration Kit. See example (TODO).

## Usage example

```tsx
export const SyncData = () => {
  const { yMap, yProvider } = useMemo(() => {
    const yProvider = new YjsProvider() // Eg. HocuspocusProvider or WebrtcProvider
    const yMap = yProvider.document.getMap('data')
    return { yMap, yProvider }
  }, [])

  useEffect(
    () => () => {
      yProvider.destroy()
    },
    [yProvider],
  )

  return (
    <SyncYMap
      yMap={yMap} // YMap to be observed for remote changes by yMap.observeDeep()
      setData={setData} // Action creator to be called as dispatch(setData(data))
      selectData={selectData} // Selector to be used as useSelector(selectData)
      throttleReceiveMs={200} // Optional, defaults to 200, pending updates are batched
      throttleSendMs={200} // Optional, defaults to 200, pending updates are batched
    />
  )
}
```

# Prior art

- https://github.com/YousefED/reactive-crdt
- https://github.com/tandem-pt/zustand-yjs
- https://github.com/joebobmiles/zustand-middleware-yjs
