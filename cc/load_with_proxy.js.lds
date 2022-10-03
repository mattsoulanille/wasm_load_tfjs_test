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
  },
  create_layers_model: async function(ctx, modelJsonChars, weightsPtr, weightsLen, modelIdPtr) {
    // There has to be a better way of loading TensorFlow.js.
    if (typeof tf === 'undefined') {
      importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.js");
    }
    Module.tfjsModels = Module.tfjsModels ?? [];

    // Get the model artifacts from the model JSON.
    const modelArtifacts = JSON.parse(UTF8ToString(modelJsonChars));
    // TODO for tfjs: Users shouldn't have to set weightSpecs.
    modelArtifacts.weightSpecs = modelArtifacts.weightsManifest[0].weights;

    // Get the weights data from wasm memory.
    const weights = wasmMemory.buffer.slice(weightsPtr, weightsPtr + weightsLen);
    modelArtifacts.weightData = weights;

    // Use the fromMemory io handler to pass the model artifacts to loadLayersModel.
    const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));

    // Make a unique id for this model and store the model for later use.
    const modelId = Module.tfjsModels.length;
    Module.tfjsModels[Module.tfjsModels.length] = model;
    setValue(modelIdPtr, modelId, 'i32');

    _emscripten_proxy_finish(ctx);
  },
  predict: function(ctx, modelId, input, inputLen, output, outputLen) {
    // Get the previously loaded model.
    // TODO: Send error to C instead of throwing here?
    const model = Module.tfjsModels[modelId];
    if (!model) {
      throw new Error(`Missing model ${modelId}`);
    }

    const dtypeSize = 4; // Size of float32. TODO: Get dtype from the input.

    // Get the input tensor data.
    // TODO: Allow passing shapes and dtypes.
    // TODO: Multiple inputs.
    const inputBuffer = wasmMemory.buffer.slice(input, input + inputLen * dtypeSize);
    const inputArray = new Float32Array(inputBuffer);
    const inputTensor = tf.tensor1d(inputArray, 'float32');

    // Run prediction. This can be async if needed, but it's sync here for simplicity.
    const outArray = model.predict(inputTensor).dataSync();
    const outBuf = outArray.buffer;
    
    // Send the output tensor back to C.
    // TODO: Multiple outputs?
    // TODO: Output shapes and dtypes.
    const data = _malloc(outBuf.byteLength);
    writeArrayToMemory(new Uint8Array(outBuf), data);
    setValue(output, data, '*');
    setValue(outputLen, outArray.length, 'i32');

    _emscripten_proxy_finish(ctx);
  }
});
