**kvack** lets you watch a specific file path for changes. Because watchers
are tied to paths rather than specific files, they report `create` and
`delete` events in addition to `modify` events.

#### Usage

```js
var kvack = require('kvack')
  , watcher = kvack('/path/to/file')

watcher.on('change', function (event) {
  // the event will be either 'create', 'modify' or 'delete'; specific
  // events are emitted alongside the general 'change' event
})
```
