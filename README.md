# Collaboration Kit (Alpha Preview)

Monorepo for packages that facilitate working with arbitrary JSON structures in [Yjs](https://github.com/yjs/yjs).

<!-- - `@sanalabs/y-react` Two-way sync of React state and Yjs -->

- [`@sanalabs/y-redux`](#sanalabsy-redux) Two-way sync of Redux and Yjs
- [`@sanalabs/y-json`](#sanalabsy-json) Utility functions to mutate Yjs types according to a target JSON object
- [`@sanalabs/json`](#sanalabsjson) Utility functions to mutate, validate and diff JSON objects

# `@sanalabs/y-json`

The package exports a function `patchYJson(yTypeToMutate, newState)` that applies Yjs operations on `yTypeToMutate` (an arbitrarily deep structure of YMaps, YArrays and JSON primitives) so that it represents a given JSON object `newState`. That is, `yTypeToMutate.toJSON()` is deep-equal to `newState`.

# `@sanalabs/y-redux`

The package exports a React component `SyncYMap` that acts as a two-way synchronization of a Redux state and a YMap. When `SyncYMap` is mounted it keeps the state in sync by:

1. Listening for changes to the YMap (observeDeep) and writing them to the Redux state (dispatching an action).
2. Listening for changes to the Redux state (useSelector) and writing them to the YMap (Yjs mutation operations).

The YMap can be a deep structure containing YMaps, YArrays and JSON primitives.

The Yjs mutations are batched into a transaction. Writes in both directions (Redux and Yjs) are throttled for performance (and is configurable).

### Retaining referential equality whenever possible

Retaining object references for parts of the state that didn't change is important for performance and allows the caching mechanism of Redux selectors to function correctly.

- Redux-to-Yjs: `SyncYMap` uses `patchYJson` which creates Yjs operations only for the part of the state that changed.
- Yjs-to-Redux: This can be done by using deepPatchJson (exported from `@sanalabs/json`) in the reducer that applies the Redux updates. See example (TODO).

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

# Notes

## No excessive package dependencies

Collaboration Kit is split into multiple smaller packages so that excessive package dependencies can be avoided. You probably don't want to install React on your backend.

## Peer dependencies

A number of dependencies (react, redux, yjs) are [peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies). Otherwise, strange runtime bugs will occur due to version incompatibilities.

## Prior art

- https://github.com/YousefED/reactive-crdt
- https://github.com/tandem-pt/zustand-yjs
- https://github.com/joebobmiles/zustand-middleware-yjs
