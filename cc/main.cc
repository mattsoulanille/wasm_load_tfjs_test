/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <cstdio>
#include <ctime>
#include <string>
#include <emscripten.h>
#include <emscripten/proxying.h>
#include "thread_utils.h"
#include <time.h>
#include <string.h>

extern "C" {

/*
 * Load some files using a proxy queue.
 *
 * Downloads all the files in the `url` list and stores their contents in a new
 * data array that it allocates. Sets the `data_ptr` to point to this new array.
 *
 * You must `free(*data_ptr)` when you're done with it.
 *
 * Sets `offsets` to the end of each file in *data_ptr. For example:
 *                      (offset = 0)
 *   file0: 5 bytes     (offset += 5)
 *   file1: 15 bytes    (offset += 15)
 *   file2: 10 bytes    (offset += 10)
 *
 *   offsets == {5, 20, 30}
 *   *data_ptr has length 30
 */
extern void load_with_proxy(em_proxying_ctx* ctx, uint32_t urls_count,
                            const char* url[], char** data_ptr,
                            uint32_t offsets[]);

int main() {
  // Create a ProxyWorker that will proxy function calls into pthreads.
  emscripten::ProxyWorker proxy;

  constexpr int url_count = 5;

  // Allocate a buffer for storing the model. There's probably a better way to
  // do this.
  char* data_ptr[] = {nullptr};

  // The offsets of each file loaded by load_with_proxy.
  uint32_t offsets[url_count];

  // These urls include the model.json file and the weights files.
  const char* urls[] = {
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json\0",
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/group1-shard1of4\0",
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/group1-shard2of4\0",
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/group1-shard3of4\0",
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/group1-shard4of4\0",
  };

  printf("Calling proxy\n");
  proxy([&](auto ctx) { load_with_proxy(ctx.ctx, url_count, urls, data_ptr, offsets); });
  printf("After proxy call\n");

  char* data = *data_ptr;

  printf("Offsets are %d, %d, %d, %d, %d\n", offsets[0], offsets[1],
         offsets[2], offsets[3], offsets[4]);

  // Copy the model json to a string
  printf("Allocating %d bytes for model.json\n", offsets[0] + 1);
  char* model_json_chars = (char*) calloc(offsets[0] + 1, sizeof(char));
  strncpy(model_json_chars, data, offsets[0]);
  model_json_chars[offsets[0]] = '\0'; // Null terminate the string.
  std::string model_json = model_json_chars;
  free(model_json_chars);

  // Get a pointer to the model weights files. They are already concatenated, so
  // no extra copying is required.
  char* model_weights = data + offsets[0];
  size_t model_weights_len = offsets[4] - offsets[0];

  EM_ASM({
      importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.js");
      const modelJson = JSON.parse(UTF8ToString($0));
      console.log(modelJson);
      const weights = wasmMemory.buffer.slice($1, $1 + $2);
      modelJson.weightData = weights;
      modelJson.weightSpecs = modelJson.weightsManifest[0].weights;

      // Copy the weights metadata to weightSpecs.
      modelJson.weightSpecs = [];
      for (const entry of modelJson.weightsManifest) {
        modelJson.weightSpecs.push(...entry.weights);
      }

      const ioHandler = tf.io.fromMemorySync(modelJson);
      const model = tf.loadGraphModelSync(ioHandler);

      const input = tf.randomUniform([1, 224, 224, 3]);
      const prediction = model.predict(input).dataSync();

      tf.loadGraphModel("https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json")
          .then((expectedModel) => {
              const expectedPrediction = expectedModel.predict(input).dataSync();
              for (let i = 0; i < expectedPrediction.length; i++) {
                if (prediction[i] !== expectedPrediction[i]) {
                  throw new Error(`Prediction did not match expected at ${i}`);
                }
              }
              console.log("Prediction and expected prediction match");
            });
    }, model_json.c_str(), model_weights, model_weights_len);

  free(data);
  return 0;
}
}
