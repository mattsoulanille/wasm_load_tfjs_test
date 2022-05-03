# WASM Load TFJS

Demo loading a tfjs graph model synchronously from wasm. This uses a new synchronous http api. It's not efficient since it has to load each file one at a time, and it blocks the main thread while loading. It could be run in a webworker, but it still would only load one file at a time.

## Files
* `cc/main.cc` is the main wasm entrypoint.
* `web/index.ts` loads `main.cc` and is the main js entrypoint.

## How to run
### Clone the repo

```shell
git clone --recurse-submodules https://github.com/mattsoulanille/wasm_load_tfjs_test.git
```

### Build tfjs

```shell
yarn build-tfjs
```

### Serve the test app

```shell
yarn serve
```

Check the javascript console for results. The network tab shows the issue with synchronous loading, where only one file can be loaded at a time.
