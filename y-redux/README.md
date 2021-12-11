# `@sanalabs/y-redux`

This package exports two React components:

- `SyncYJson`: Two-way synchronization of a deep YMap/YArray and a Redux state.
- `SyncYAwareness`: Synchronization of YDoc awareness states (remote and local) and a Redux state.

## Table of Contents

- [@sanalabs/y-redux](#sanalabsy-redux)
  - [SyncYJson](#syncyjson)
    - [Retaining referential equality whenever possible](#retaining-referential-equality-whenever-possible)
    - [Usage example](#usage-example)
  - [SyncYAwareness](#syncyawareness)
  - [FAQ](#faq)
    - [Why is SyncYJson a component and not a hook?](#why-is-syncyjson-a-component-and-not-a-hook)
    - [Why is SyncYJson a React component and not a more generic Redux integration?](#why-is-syncyjson-a-react-component-and-not-a-more-generic-redux-integration)
    - [Why does SyncYJson throttle the updates?](#why-does-syncyjson-throttle-the-updates)

## `SyncYJson`

This is a two-way synchronization of a Redux state and a YMap/YArray. When `SyncYJson` is mounted it keeps the state in sync by:

1. Listening for changes to the YType (observeDeep) and writing them to the Redux state (dispatching an action).
2. Listening for changes to the Redux state (useSelector) and writing them to the YType (Yjs mutation operations).

The YType can be a deep structure containing YMaps, YArrays and JSON primitives.

The Yjs mutations are batched into a transaction. Writes in both directions (Redux and Yjs) are throttled for performance (and is configurable).

### Retaining referential equality whenever possible

Retaining object references for parts of the state that didn't change is important for performance and allows the caching mechanism of Redux selectors to function correctly.

- Redux to Yjs: `SyncYJson` uses `patchYJson` which creates Yjs operations only for the part of the state that changed.
- Yjs to Redux: This can be done by using deepPatchJson (exported from `@sanalabs/json`) in the reducer that applies the Redux updates. See example (TODO).

### Usage example

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
    <SyncYJson
      yMap={yMap} // YMap to be observed for remote changes by yMap.observeDeep()
      setData={setData} // Action creator to be called as dispatch(setData(data))
      selectData={selectData} // Selector to be used as useSelector(selectData)
      throttleReceiveMs={200} // Optional, defaults to 200, pending updates are batched
      throttleSendMs={200} // Optional, defaults to 200, pending updates are batched
    />
  )
}
```

## `SyncYAwareness`

Very similar to `SyncYJson`

## FAQ

### Why is `SyncYJson` a component and not a hook?

**Answer:** For performance and convenience. It makes no difference to the consumer of this API since
`SyncYJson` doesn't return anything. Think of the component as a provider component.

The performance issue with hooks is that any time an effect within a hook runs, that triggers a re-render of
the surrounding component. Since the hooks within `SyncYJson` may trigger very often due to remote changes we
noticed that it was confusing and not convenient to have the functionality as a hook.

### Why is `SyncYJson` a React component and not a more generic Redux integration?

**Answer:** Having this logic as a first class citizen in React makes it easy to control when to use SyncYJson
and to have multiple instances for different parts of your application.

### Why does `SyncYJson` throttle the updates?

**Answer:** For performance. Note that it's easy to opt out by setting the throttle to 0, but you probably
want to throttle. Throttling is useful because you probably re-render based on the updates, and it makes no
sense to render instantly if the remote changes are very frequent (due to many users modifying the state) and
there is already delay due to network. The throttling implicitly creates a batching of all the updates.
