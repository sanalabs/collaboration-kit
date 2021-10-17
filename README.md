# Collaboration Kit

Monorepo for packages that facilitate working with arbitrary JSON structures in [Yjs](https://github.com/yjs/yjs).

- `y-react` React state synced with Yjs (TODO Jesper)
- `y-redux` Redux state synced with Yjs
- `y-json` Utility functions to translate between Yjs and JSON and vice versa
- `json-mutate` Utility functions to mutate JSON (patch and merge)
- `json` Utility functions to validate JSON

## Principles

### Strict typing (compile-time) and validation (run-time)

- Typed with TypeScript
- Assertions in runtime to guarantee that no corrupt data gets propagated

### Prohibit `undefined`

`undefined` is not a valid JSON type. However, a property with the value `undefined` in JavaScript is in some contexts considered equivalent to that property not existing. For example:

```js
JSON.stringify({ prop: undefined }) === JSON.stringify({}) // '{}'
```

But not always:

```js
JSON.stringify([undefined]) === JSON.stringify([null]) // What!?
```

It's actually quite confusing:

```js
const obj = { a: undefined }
obj.a === obj.b // true
```

To increase the strictness and predictability of the code, Collaboration Kit strictly prohibits undefined to be passed around. This is achieved through runtime assertions, see [`json`](https://github.com/sanalabs/collaboration-kit/tree/main/json).

### No excessive package dependencies

Collaboration Kit is split into multiple smaller packages so that excessive package dependencies can be avoided. You probably don't want to install React on your backend.

### Peer dependencies

A number of dependencies (react, redux, yjs) are [peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies). Otherwise, strange runtime bugs will occur due to version incompatibilities.

# Prior art

- https://github.com/YousefED/reactive-crdt
- https://github.com/tandem-pt/zustand-yjs
- https://github.com/joebobmiles/zustand-middleware-yjs
