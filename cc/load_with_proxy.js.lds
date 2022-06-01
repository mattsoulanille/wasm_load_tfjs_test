mergeInto(LibraryManager.library, {
  load_with_proxy: async function(ctx, urlPtr, dataPtr, maxLen, receivedLenPtr) {
    // Get the string pointed to by urlPtr.
    const url = UTF8ToString(urlPtr);

    // Fetch the url.
    const data = await (await fetch(url)).arrayBuffer();
    const array = new Uint8Array(data);

    // Set receivedLenPtr to the length of the fetched data.
    // Note the three open and close braces are a macro parsed by the emscripten
    // compiler. For that reason, javascript variables need to be quoted.
    // https://github.com/emscripten-core/emscripten/blob/main/src/parseTools.js#L435
    {{{ makeSetValue('receivedLenPtr', 0, 'array.length', 'u32') }}}

    // Set the data.
    for (let i = 0; i < Math.min(array.length, maxLen); i++) {
      {{{ makeSetValue('dataPtr', 'i', 'array[i]', 'u8') }}}
    }
    // Notify emscripten that the function is done.
    _emscripten_proxy_finish(ctx);
  }
});
