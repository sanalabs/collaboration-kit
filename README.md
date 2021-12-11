# Collaboration Kit (Alpha Preview)

Monorepo for packages that facilitate working with arbitrary JSON structures in [Yjs](https://github.com/yjs/yjs).

<!-- - `@sanalabs/y-react` Two-way sync of React state and Yjs -->

- [`@sanalabs/y-redux`](https://github.com/sanalabs/collaboration-kit/tree/main/y-redux) Two-way sync of Redux and Yjs
- [`@sanalabs/y-json`](https://github.com/sanalabs/collaboration-kit/tree/main/y-json) Utility functions to mutate Yjs types according to a target JSON object
- [`@sanalabs/json`](https://github.com/sanalabs/collaboration-kit/tree/main/json) Utility functions to mutate, validate and diff JSON objects

## Documentation

See each package for documentation. Links above 👆.

## Notes

### No excessive package dependencies

Collaboration Kit is split into multiple smaller packages so that excessive package dependencies can be avoided. You probably don't want to install React on your backend.

### Peer dependencies

A number of dependencies (React, Redux, Yjs) are [peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies). Otherwise, [runtime bugs](https://github.com/yjs/yjs/commit/cbddf6ef90be3493661bb36a416627f86a0700b6) will occur due to version incompatibilities.

### Prior art

- https://github.com/YousefED/reactive-crdt
- https://github.com/tandem-pt/zustand-yjs
- https://github.com/joebobmiles/zustand-middleware-yjs
