mergeInto(LibraryManager.library, {
  load_with_proxy: async function(ctx, urlPtr, dataPtr, maxLen, receivedLenPtr) {
    const url = UTF8ToString(urlPtr);
    const data = await (await fetch(url)).arrayBuffer();
    console.log(data);
    const array = new Uint8Array(data);

    // Note the three open and close braces are a macro parsed by the emscripten
    // compiler.
    // https://github.com/emscripten-core/emscripten/blob/main/src/parseTools.js#L435
    {{{ makeSetValue('receivedLenPtr', 0, 'array.length', 'u32') }}}

    // Set the data.
    for (let i = 0; i < Math.min(array.length, maxLen); i++) {
      {{{ makeSetValue('dataPtr', 'i', 'array[i]', 'u8') }}}
    }
    _emscripten_proxy_finish(ctx);
  }
});
