# "y-json" NAME IS WIP - each package has it's own name, this is a monorepo for multiple packages

A set of tools to facilitate working with arbitrary JSON structures in Yjs.

* `y-react` React state synced with Yjs (TODO Jesper)
* `y-redux` Redux state synced with Yjs
* `y-json` Utility functions to translate between Yjs and JSON and vice versa

## What is valid JSON data?

Valid JSON is one of the following TypeScript types:
* `string`
* `number`
* `boolean`
* `null`
* `Array<unknown>`
* `Record<string, unknown>`

### How is `unknown` handled?

`unknown` is not a valid JSON type. However, a property wih value `undefined` in JavaScript is to be considered equivalent to that property not existing. For example:
```js
JSON.stringify({ prop: undefined }) === JSON.stringify({}) // '{}'
```
Also note that
```js
const obj = { a: undefined }
obj.a === obj.b // true
```
but
```js
Object.keys(obj) // ['a']
```
It is even more confusing for arrays

## `undefined` is ambiguous in javascript

To increase the strictness and predictability of the code, remove you `undefined`s completely before

This is why `isJsonPrimitive(undefined) === false`.


Whenever a value is set to undefined in JS, JSON-Patch methods generate and compare will treat it similarly to how JavaScript method JSON.stringify (MDN) treats them:

[`JSON.stringify` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) treats undefined differently depending on context:

> If `undefined` (...) is encountered during conversion it is either omitted (when it is found in an object) or censored to `null` (when it is found in an array).

We want to simply avoid this, so all JSON must not contain `undefined`.


# Prior art

* https://github.com/YousefED/reactive-crdt
* https://github.com/tandem-pt/zustand-yjs
* https://github.com/joebobmiles/zustand-middleware-yjs/
