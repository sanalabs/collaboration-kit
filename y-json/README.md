# `@sanalabs/y-json`

This package exports the following functions:

## `patchYJson(yTypeToMutate, newState)`

This function applies Yjs operations on `yTypeToMutate` (an arbitrarily deep structure of YMaps, YArrays and JSON primitives) so that it represents a given JSON object `newState`. That is, `yTypeToMutate.toJSON()` is deep-equal to `newState`.
