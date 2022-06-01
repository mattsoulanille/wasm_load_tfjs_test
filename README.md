# WASM Load TFJS

Demo loading a file synchronously using a WASM pthread proxy. This method uses asynchronous fetch from WASM without Asyncify. Instead, it uses [Emscripten's proxying API](https://emscripten.org/docs/api_reference/proxying.h.html) to run fetch() in a pthread. This example only loads a single file, but it can be extended to load multiple files or a TFJS model for a synchronous WASM application.

## Files
* `cc/main.cc` is the main wasm entrypoint.
* `web/index.html` is the html page.
* `cc/load_with_proxy.js.lds` is the asynchronous javascript code that runs in the proxied pthread and fetches the file. Right now, it only fetches a single file, but it can be modified to fetch multiple at once.
* `cc/thread_utils.h` is Emscripten's implementation of a ProxyWorker. It proxies synchronous and asynchronous function calls to pthreads.

## How to run
### Clone the repo

```shell
git clone --recurse-submodules https://github.com/mattsoulanille/wasm_load_tfjs_test.git
```

### Install packages

```shell
yarn
```

### Serve the test app

```shell
yarn serve
```
