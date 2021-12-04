# Collaboration Kit

Monorepo for packages that facilitate working with arbitrary JSON structures in [Yjs](https://github.com/yjs/yjs).

- `@sanalabs/y-react` React state synced with Yjs (TODO Jesper)
- `@sanalabs/y-redux` Redux state synced with Yjs
- `@sanalabs/y-json` Utility functions to mutate Yjs types according to a target JSON object
- `@sanalabs/json` Utility functions to validate and mutate JSON (patch and merge)

## Notes

### No excessive package dependencies

Collaboration Kit is split into multiple smaller packages so that excessive package dependencies can be avoided. You probably don't want to install React on your backend.

### Peer dependencies

A number of dependencies (react, redux, yjs) are [peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies). Otherwise, strange runtime bugs will occur due to version incompatibilities.

# Prior art

- https://github.com/YousefED/reactive-crdt
- https://github.com/tandem-pt/zustand-yjs
- https://github.com/joebobmiles/zustand-middleware-yjs
