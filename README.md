# WASM Load TFJS

Demo creating a layers model using a WASM pthread proxy. This method uses asynchronous fetch from WASM without Asyncify. Instead, it uses [Emscripten's proxying API](https://emscripten.org/docs/api_reference/proxying.h.html) to run fetch() in a pthread. This example loads the layers model files and then instantiates the model in a proxy queue. It runs the model in the proxy queue as well.

## Files
* `cc/main.cc` is the main wasm entrypoint.
* `web/index.html` is the html page.
* `cc/load_with_proxy.js.lds` is the asynchronous javascript code that runs in the proxied pthread. It fetches the model files, instantiates the model, and runs it.
* `cc/thread_utils.h` is Emscripten's implementation of a ProxyWorker. It proxies synchronous and asynchronous function calls to pthreads.
* `web/double_model/` A simple tfjs layers model that doubles any number given to it (might fail for numbers outside of [0, 10]).
* `web/model/model.js` Trains and saves double_model.

## How to run
### Clone the repo

```shell
git clone https://github.com/mattsoulanille/wasm_load_tfjs_test.git
```

### Install packages

```shell
yarn
```

### Serve the test app

```shell
yarn serve
```
