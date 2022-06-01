# WASM Load TFJS

Demo loading a file synchronously using a WASM pthread proxy. This method enables using asynchronous fetch from WASM without using Asyncify. It can be extended to load a TFJS model for a synchronous WASM application.

Right now, the demo loads a single file, but since it can run asynchronously, it can be modified to load multiple files at once.

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
