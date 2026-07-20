# ember-import-meta-glob

Implements [RFC#939](https://github.com/emberjs/rfcs/blob/main/text/0939-import-glob.md) for classic and Embroider application builds.

## Installation

```
pnpm add --save-dev ember-import-meta-glob
```

## Requirements

* Ember 3.28
* ember-auto-import v2

On Embroider builds, no further setup is necessary.

On classic builds, using lazy globs require [dynamic imports](https://github.com/embroider-build/ember-auto-import/tree/main/packages/ember-auto-import#dynamic-import) and [app imports](https://github.com/embroider-build/ember-auto-import/tree/main/packages/ember-auto-import#app-imports) to be enabled in your build configuration:

```js
// ember-cli-build.js
let app = new EmberApp(defaults, {
  autoImport: {
    allowAppImports: [
      // minimatch patterns for all app files that match non-eager `import.meta.glob` calls
      'mirage/**/*'
    ]
  },
  babel: {
    plugins: [require.resolve('ember-auto-import/babel-plugin')],
  }
});
```

## Usage

Default (lazy) glob imports:

```js
const models = import.meta.glob('../models/*');

// Transforms into:
//
// const models = {
//   '../models/first': () => import('../models/first'),
//   '../models/second': () => import('../models/second')
// }
```

> [!IMPORTANT]
> On classic builds, make sure all files that match lazy glob patterns are covered by a pattern in `app.options.autoImport.allowAppImports`.

Eager glob imports:

```js
const models = import.meta.glob('../models/*', { eager: true });

// Transforms into:
//
// import * as emberGlob0 from '../models/first'
// import * as emberGlob1 from '../models/second'
// const models = {
//   '../models/first': emberGlob0,
//   '../models/second': emberGlob1
// }
```

## Differences from RFC#939

* Extensions in the import path are optional
* Keys in the returned object will not contain filename extensions

## License

This project is licensed under the [MIT License](LICENSE.md).
