mergeInto(LibraryManager.library, {
  load_with_proxy: async function(ctx, urlsCount, urlPtrs, dataPtr, offsetsPtr) {
    const pointerSize = 4;

    // Get the urls to load
    const urls = [];
    for (let i = 0; i < urlsCount; i++) {
      const ptr = getValue(urlPtrs + i * pointerSize, '*');
      urls[i] = UTF8ToString(ptr);
    }

    // Fetch the urls.
    const arrays = await Promise.all(urls.map(
        async (url) => new Uint8Array(await (await fetch(url)).arrayBuffer())));

    // Allocate memory for the returned arrays
    const totalSize = arrays.reduce((accumulator, array) => accumulator + array.length, 0);
    const data = _malloc(totalSize);

    // Set the dataPtr to point to the newly allocated data.
    setValue(dataPtr, data, '*');

    // Set the values
    let offset = 0;
    for (let i = 0; i < urlsCount; i++) {
      // Write the array to data offset by 'offset'
      const array = arrays[i];
      writeArrayToMemory(array, data + offset);
      offset += array.length;

      // Record the offset in offsetsPtr
      {{{ makeSetValue('offsetsPtr', 'i*4', 'offset', 'u32') }}}
    }

    // Notify emscripten that the function is done.
    _emscripten_proxy_finish(ctx);
  }
});
